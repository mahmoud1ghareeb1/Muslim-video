import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

if (!API_KEY) {
  console.error("VITE_GEMINI_API_KEY for Gemini is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

interface VideoMetadata {
    title: string;
    thumbnailUrl: string;
}

export const fetchVideoMetadata = async (url: string): Promise<VideoMetadata> => {
    if (!API_KEY) {
        throw new Error("API Key not configured.");
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `For the following URL, please extract the title of the video or page, and a direct URL to a representative thumbnail image. Please provide the response in a JSON object. If you cannot find a thumbnail, use a placeholder from picsum.photos. URL: ${url}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: {
                            type: Type.STRING,
                            description: "The title of the video or web page.",
                        },
                        thumbnailUrl: {
                            type: Type.STRING,
                            description: "A direct URL to a thumbnail image for the video or page.",
                        },
                    },
                    required: ["title", "thumbnailUrl"],
                },
            },
        });

        const jsonString = response.text.trim();
        const metadata = JSON.parse(jsonString) as VideoMetadata;

        // Basic validation
        if (typeof metadata.title !== 'string' || typeof metadata.thumbnailUrl !== 'string') {
            throw new Error('Invalid metadata format from API');
        }

        return metadata;

    } catch (error) {
        console.error("Error fetching video metadata from Gemini API:", error);
        throw new Error("Failed to fetch video metadata. Please check the URL and try again.");
    }
};
