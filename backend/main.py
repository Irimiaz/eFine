from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Set, Tuple
from dotenv import load_dotenv
from collections import deque
from urllib.parse import urljoin, urlparse, urldefrag
import re
import httpx
from bs4 import BeautifulSoup

load_dotenv()
app = FastAPI()

class ScrapeWebsiteRequest(BaseModel):
    url: str


# ---------------- PAP crawler helpers ----------------

PAP_KEYWORDS = [
    "planul de achizitii publice",
    "plan de achizitii publice",
    "plan anual de achizitii publice",
    "plan anual achizitii publice",
    "pap",
    "paap",
    "achizitii publice",
    "achiziții publice",
]

DOC_EXTENSIONS = (".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv")
YEAR_RE = re.compile(r"\b(20\d{2})\b")


def normalize_url(base: str, href: str) -> Optional[str]:
    if not href:
        return None
    href = href.strip()
    if href.startswith(("mailto:", "tel:", "javascript:")):
        return None
    abs_url = urljoin(base, href)
    abs_url, _ = urldefrag(abs_url)  # drop #fragment
    return abs_url


def same_site(root: str, candidate: str) -> bool:
    r = urlparse(root)
    c = urlparse(candidate)
    return bool(r.netloc and c.netloc and r.netloc == c.netloc)


def is_document_link(url: str) -> bool:
    return urlparse(url).path.lower().endswith(DOC_EXTENSIONS)


def is_probably_html(url: str) -> bool:
    path = urlparse(url).path.lower()
    if path.endswith(DOC_EXTENSIONS):
        return False
    if path.endswith((".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".mp4", ".zip", ".rar", ".7z")):
        return False
    return True


def looks_like_pap(text: str, url: str) -> bool:
    blob = ((text or "") + " " + (url or "")).lower()
    return any(k in blob for k in PAP_KEYWORDS)


def guess_year(text: str, url: str) -> Optional[int]:
    m = YEAR_RE.search((text or "") + " " + (url or ""))
    return int(m.group(1)) if m else None


def file_type(url: str) -> str:
    path = urlparse(url).path.lower()
    for ext in DOC_EXTENSIONS:
        if path.endswith(ext):
            return ext.lstrip(".")
    return "html"


async def fetch_html(client: httpx.AsyncClient, url: str) -> Optional[str]:
    try:
        resp = await client.get(url, timeout=20.0, follow_redirects=True)
        if resp.status_code >= 400:
            return None
        ct = resp.headers.get("content-type", "").lower()
        if "text/html" not in ct and "application/xhtml+xml" not in ct:
            return None
        return resp.text
    except httpx.HTTPError:
        return None


def extract_links(page_url: str, html: str) -> List[Tuple[str, str]]:
    soup = BeautifulSoup(html, "html.parser")
    out: List[Tuple[str, str]] = []
    for a in soup.find_all("a"):
        href = a.get("href")
        abs_url = normalize_url(page_url, href)
        if not abs_url:
            continue
        text = a.get_text(" ", strip=True) or ""
        out.append((abs_url, text))
    return out


# ---------------- Endpoint ----------------

@app.post("/scrape-website")
async def scrape_website(request: ScrapeWebsiteRequest):
    root = request.url.strip()
    if not root.startswith("http"):
        raise HTTPException(status_code=400, detail="URL must start with http/https")

    # tweakable limits
    max_pages = 60
    max_depth = 3

    visited: Set[str] = set()
    q = deque([(root, 0)])

    # dedupe by doc URL
    found: Dict[str, Dict[str, Any]] = {}

    headers = {
        "User-Agent": "PAP-Crawler/1.0 (+educational)",
        "Accept": "text/html,application/xhtml+xml",
    }

    async with httpx.AsyncClient(headers=headers) as client:
        pages_fetched = 0

        while q and pages_fetched < max_pages:
            page_url, depth = q.popleft()
            if page_url in visited:
                continue
            visited.add(page_url)

            if depth > max_depth:
                continue
            if not same_site(root, page_url):
                continue
            if not is_probably_html(page_url):
                continue

            html = await fetch_html(client, page_url)
            pages_fetched += 1
            if not html:
                continue

            links = extract_links(page_url, html)

            # collect PAP docs
            for link_url, anchor_text in links:
                if is_document_link(link_url) and looks_like_pap(anchor_text, link_url):
                    found[link_url] = {
                        "site_root": root,
                        "page_found_on": page_url,
                        "title": anchor_text[:300],
                        "url": link_url,
                        "type": file_type(link_url),
                        "year": guess_year(anchor_text, link_url),
                    }

            # enqueue next pages (simple priority so it hits "achizitii" pages sooner)
            next_pages: List[Tuple[int, str]] = []
            for link_url, anchor_text in links:
                if link_url in visited:
                    continue
                if not same_site(root, link_url):
                    continue
                if not is_probably_html(link_url):
                    continue

                prio = 0
                if looks_like_pap(anchor_text, link_url):
                    prio += 10
                if "achiz" in (anchor_text.lower() + " " + link_url.lower()):
                    prio += 5

                next_pages.append((prio, link_url))

            next_pages.sort(key=lambda x: x[0], reverse=True)
            for _prio, link_url in next_pages:
                if link_url not in visited:
                    q.append((link_url, depth + 1))

    docs = list(found.values())

    return {
        "status": "success",
        "site": root,
        "pages_crawled": len(visited),
        "documents_found": len(docs),
        "data": docs,
    }
