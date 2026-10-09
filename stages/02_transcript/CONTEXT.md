# 02 — Words and timing
Install requirements-transcription.txt for optional local Whisper. After voice review, 'python anim.py transcribe my-lesson --model base --no-verify' uses a smaller initial model. First use may download weights. CPU works; larger models need more memory/time.

The default uses large-v3 and may load a second model for flagged text. It can respell from the script. Compare suspicious words with the recording; two models agreeing is not proof.

Output: words.json with {voice,duration,model,words:[{text,start,end}]} plus transcript.md. Review names, missing/repeated words and timing. --force overwrites timing. Recompile cues after corrections. The silent fixture contains empty words and authored timestamps, not a transcript.
