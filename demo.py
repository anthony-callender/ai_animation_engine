"""Creates a labelled silent exercise; never calls speech services."""
import argparse,json,subprocess,sys,wave
from pathlib import Path
ROOT=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument("slug",nargs="?",default="silent-first-scene")
p.add_argument("--format",choices=["wide","tall"],default="wide");p.add_argument("--style",choices=["pixel","line"],default="pixel");a=p.parse_args()
subprocess.run([sys.executable,str(ROOT/"anim.py"),"new",a.slug,"--format",a.format,"--style",a.style],check=True,cwd=ROOT)
d=ROOT/"videos"/a.slug
with wave.open(str(d/"01_voice/voice.wav"),"wb") as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(16000);w.writeframes(b"\0\0"*(16000*8))
(d/"01_voice/brief.md").write_text("# Synthetic silent exercise\n\nShow one file through PLAN, BUILD and REVIEW. Eight seconds. Authored illustration; no client data, speech or executed AI result.\n",encoding="utf-8")
(d/"01_voice/script.md").write_text("# No spoken narration\n\nThis silent setup fixture does not test TTS or transcription.\n",encoding="utf-8")
(d/"02_transcript/words.json").write_text(json.dumps({"voice":"voice.wav","duration":8,"model":"synthetic-silent-fixture","words":[]},indent=2),encoding="utf-8")
(d/"02_transcript/transcript.md").write_text("# Authored silent timing\n\nNo words spoken. 0–3s PLAN; 3–6s BUILD; 6–8s REVIEW.\n",encoding="utf-8")
(d/"03_cues/cues.md").write_text("# Silent storyboard\n\n## intro @0\nPLAN. Authored illustration.\n\n## build @3\nBUILD.\n\n## review @6\nREVIEW before sharing.\n",encoding="utf-8")
(d/"04_scene/scene.js").write_text(r"""
// Authored synthetic illustration: no narration or executed assistant result.
const LABELS=['PLAN','BUILD','REVIEW'],E=window.Eduba,L=window.Line;
function draw(g,t){
 const idx=t<3?0:t<6?1:2,tall=g.H>g.W,xs=tall?[90,90,90]:[64,160,256],ys=tall?[84,150,216]:[100,100,100];
 if(E){
  E.room(g,'dots');
  E.plate(g,'ONE FILE / THREE STEPS',g.W/2,tall?34:22,{align:'center',w:g.W-24,role:'head'});
  LABELS.forEach((name,i)=>{E.file(g,xs[i]-10,ys[i]-6,{name:'idea.md',lit:i===idx});E.plate(g,name,xs[i],ys[i]+28,{align:'center',w:76,role:'body',fg:i===idx?'#E8A860':'#9b978f'});});
  E.plate(g,'SILENT / AUTHORED EXAMPLE',g.W/2,tall?278:156,{align:'center',w:g.W-24,role:'label'});
 }else{
  L.room(g,'grid');L.text(g,'ONE FILE / THREE STEPS',12,tall?36:26,{role:{size:tall?44:54,weight:700}});
  LABELS.forEach((name,i)=>L.text(g,(i===idx?'*':'')+name+(i===idx?'*':''),xs[i]-25,ys[i],{role:{size:64,weight:700}}));
  L.text(g,'SILENT / AUTHORED',12,tall?278:164,{role:{size:30,weight:400}});
 }
}
if(E)E.frame({draw});else L.frame({draw});
""",encoding="utf-8")
subprocess.run([sys.executable,str(ROOT/"anim.py"),"cues",a.slug],check=True,cwd=ROOT)
print("Silent sample ready. Review stills and preview. No speech service was used.")
