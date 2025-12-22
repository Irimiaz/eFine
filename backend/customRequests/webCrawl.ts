import axios from "axios";

export const scrapeWebsite = async (params: Record<string, any>) => {
  const { url } = params;

  if (!url) {
    return { status: "error", message: "No url provided" };
  }

  try {
    const res = await axios.post(`http://127.0.0.1:8000/scrape-website`, {
      url,
    });
    return {
      status: "success",
      data: res.data,
    };
  } catch (error: any) {
    return {
      status: "error",
      message: error.message || "Internal server error",
    };
  }
};
