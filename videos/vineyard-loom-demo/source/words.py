import json, sys, warnings
warnings.filterwarnings("ignore")
import whisper
m = whisper.load_model("small", device="cpu")
r = m.transcribe(sys.argv[1], word_timestamps=True, condition_on_previous_text=False, language="en", fp16=False,
                 initial_prompt="Vineyard Church, Wix, Planning Center, Anthony Callender, greeter, Plan My Visit.")
w = [{"w": x["word"].strip(), "s": round(x["start"], 2), "e": round(x["end"], 2)} for seg in r["segments"] for x in seg["words"]]
json.dump(w, open(sys.argv[2], "w", encoding="utf-8"), indent=0)
print(len(w), "words")
