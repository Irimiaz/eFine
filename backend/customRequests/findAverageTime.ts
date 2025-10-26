import axios from "axios";

export const findAverageTime = async (params: Record<string, any>) => {
  const { place_ids } = params;

  if (!Array.isArray(place_ids) || place_ids.length === 0) {
    return { status: "error", message: "No place_ids provided" };
  }

  try {
    const res = await axios.post(`http://127.0.0.1:8000/visit-time`, {
      place_ids,
    });

    const results = res.data.data;
    const formattedResults = results.map((item: any) => {
      if (item.error) {
        return {
          place_id: item.place_id,
          error: item.error,
        };
      }

      const { place_id, name, time_spent } = item;

      let averageTime = null;
      if (Array.isArray(time_spent) && time_spent.length > 0) {
        const sum = time_spent.reduce(
          (acc: number, curr: number) => acc + curr,
          0
        );
        averageTime = sum / time_spent.length;
      }

      return {
        place_id,
        name,
        average_time_spent: averageTime,
        message: item.message,
      };
    });

    return {
      status: "success",
      data: formattedResults,
    };
  } catch (error: any) {
    return {
      status: "error",
      message: error.message || "Internal server error",
    };
  }
};
