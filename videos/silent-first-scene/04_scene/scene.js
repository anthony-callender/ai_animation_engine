
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
