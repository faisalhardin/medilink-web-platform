import authedClient from "@utils/apiClient";


export const GetInsitution = async () => {
    try {
        const response = await authedClient.get(
            `/v1/institution`, {
                withCredentials: true,
              }
          );

        return await response.data
    } catch (error) {
        console.error("Error fetching institution data:", error);
        // Optional: throw or return a rejected promise to propagate the error
        throw error;
    }
}