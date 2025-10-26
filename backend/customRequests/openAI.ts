import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;

export const openAI = async (params: Record<string, any>) => {
  const { message } = params;
  const baseURL = "https://api.openai.com/v1/chat/completions";
  try {
    const response = await axios.post(
      baseURL,
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    console.log("response", response);
    const reply = response.data.choices[0].message.content;

    return {
      status: "success",
      data: { reply },
    };
  } catch (error: any) {
    console.error("OpenAI API Error:", error.message);
    return {
      status: "error",
      data: { message: error },
    };
  }
};
