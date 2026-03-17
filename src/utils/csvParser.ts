import Papa from "papaparse";
import { SlideData, SlideType } from "@/types";

export interface ParsedGameData {
  teams: string[];
  slides: SlideData[];
}

export const parseCSV = (csvText: string): Promise<ParsedGameData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as any[];
          const slides: SlideData[] = [];
          let teams: string[] = ["הנמרים", "הכרישים", "האריות"]; // Default fallback

          rows.forEach((row) => {
            const rawType = (row["Type"] || "").toUpperCase().trim();
            const content = (row["Content"] || "").trim();

            if (rawType === "SETTINGS") {
              if (content.startsWith("קבוצות:")) {
                teams = content.replace("קבוצות:", "").split(",").map((s: string) => s.trim());
              }
              return; // SETTINGS is not a slide
            }

            const type = rawType as SlideType;

            const slide: SlideData = {
              type,
              content,
            };

            if (type === "QUESTION" || type === "POLL") {
              slide.options = [
                row["Option A"]?.trim() || "",
                row["Option B"]?.trim() || "",
                row["Option C"]?.trim() || "",
                row["Option D"]?.trim() || "",
              ].filter(Boolean);

              if (type === "QUESTION") {
                // Correct is 1-indexed in CSV presumably, converting to 0-indexed integer
                const correctInt = parseInt(row["Correct"], 10);
                if (!isNaN(correctInt)) {
                  slide.correctOption = correctInt - 1; // Assuming 1=A, 2=B, etc.
                }

                // Parse modifier (J1, J2, J3 -> 1, 2, 3)
                const modRaw = row["Modifier"]?.trim() || "";
                if (modRaw.startsWith("J")) {
                  const modInt = parseInt(modRaw.substring(1), 10);
                  if (!isNaN(modInt)) slide.modifier = modInt;
                }
              }
            }

            if (type === "MEDIA") {
              slide.mediaUrl = row["URL/Media"]?.trim() || "";
            }

            slides.push(slide);
          });

          resolve({ teams, slides });
        } catch (err) {
          reject(err);
        }
      },
      error: (error: Error) => reject(error),
    });
  });
};
