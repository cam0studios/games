var url = document.getElementById("url");
var form = document.getElementById("urlForm");
var colMode = document.getElementById("colMode");
var depth = document.getElementById("depth");
var nodes = [];
var s = {x:innerWidth, y:innerHeight};
var hover = -1;
var cam = {x:0,y:0};

function setup() {
  createCanvas(s.x,s.y);
  render();
}

form.addEventListener("submit",(event) => {
  try {
    event.preventDefault();
    console.log("render");
    addNode(getUrl(url.value),2);
    render();
  } catch(err) {
    console.error(err);
  }
});
function render() {
  background(0);
  push();
  translate(-cam.x,-cam.y);
  nodes.forEach((e,i) => {
    e.urlComp = e.u.split(":").join("/").split(".").join("/").split("/").length-4;
    if(colMode.value=="complex") {
      e.col = (220*1.5)/(e.urlComp+0.5)+50;
      e.size = 100/(e.urlComp+10);
    } else if(colMode.value=="scanned") {
      e.col = e.scanned?230:110;
      e.size = e.scanned?10:6;
    } else if(colMode.value=="connect") {
      e.col = Math.min(e.c.length*1+110,230);
      e.size = Math.min(e.c.length*0.2+6,10);
    } else {
      e.col = 230;
      e.size = 9;
    }
    e.col += (hover==i)*25;
    e.size += (hover==i)*2;

    e.c.forEach((tUrl) => {
      let tI = nodes.map(e=>e.u).indexOf(tUrl);
      if(tI>=0) {
        let t = nodes[tI];
        stroke(250);
        strokeWeight(hover==i?0.7:0.5);
        line(e.x,e.y,t.x,t.y);
      }
    });
  });
  nodes.forEach((e,i) => {
    fill(e.col);
    stroke(0);
    strokeWeight(1);
    ellipse(e.x,e.y,e.size,e.size);
  });
  pop();
  cam.x += (keyIsDown(68)-keyIsDown(65))*10;
  cam.y += (keyIsDown(83)-keyIsDown(87))*10;
}
function getUrl(u,u2="") {
  if(u.startsWith("//")) u = "https:"+u;
  if(u.startsWith("#")) u = u2.split("#")[0] + "/" + u;
  if(u.includes("?")) u = u.split("?")[0];
  if(!u.includes(".")) u = "/"+u;
  if(u.startsWith("/")) u = u2 + u;
  if(u.startsWith("..")) u = u2.split("https://")[1].split(".").splice(0,2) + u;
  if(u.startsWith("."))  u = u2.split("https://")[1].split(".").splice(0,1) + u;
  if(!(u.startsWith("https://") || u.startsWith("http://"))) u = "https://"+u;
  if(u.endsWith("/")) u = u.split("/").splice(0, u.split("/").length-1).join("/");
  if(u.includes("www.")) u = u.split("www.").join("");
  return u;
}
function track(url,n=0) {
  url = getUrl(url);
  console.log("fetching "+url);
  nodes[nodes.map(e=>e.u).indexOf(url)].scanned = true;
  fetch("http://pikastinks.us.to:3000/corsProxy?url="+url)
  .then(e=>e.text())
  .then((e) => {
    console.log("got "+url);
    //e.split("</body>")
    //.join("<body>")
    //.split("<body")[1]
    e.split("src=")
    .join("href=")
    .split("href=").forEach((e,i) => {
      if(i>0 && e.startsWith("\"")) {
        let u = getUrl(e.split("\"")[1],url);
        addConnection(url,u);
        if(n>0) {
          track(u,n-1);
        }
      }
    });
    render();
  });
}

document.addEventListener("click",e => {
  if(hover>-1) {
    track(nodes[hover].u,parseInt(depth.value));
  }
});
document.addEventListener("mousemove",e => {
  try {
    hover = -1;
    nodes.forEach((n,i) => {
      if(Math.pow(e.clientX+cam.x-n.x,2)+Math.pow(e.clientY+cam.y-n.y,2) <= Math.pow(10,2)) {
        hover = i;
      }
    });
    if(hover>=0) document.getElementById("data").innerHTML = `URL: <a href="${nodes[hover].u}">${nodes[hover].u}</a><br>Scanned: ${nodes[hover].scanned}<br>Connections: ${nodes[hover].c.length}`;
    else document.getElementById("data").innerHTML = "Hover to get data";
  } catch(err) {
    console.error(err);
  }
});
document.addEventListener("keypress",e => {
  if(e.key=="e") {
    if(hover>=0) window.open(nodes[hover].u,"_blank");
  }
});

function physics() {
  nodes.forEach((n,i) => {
    n.c.forEach((tUrl) => {
      let tI = nodes.map(e=>e.u).indexOf(tUrl);
      if(tI>=0) {
        let t = nodes[tI];
        let f = {x:n.x-t.x, y:n.y-t.y};
        let d = Math.sqrt(Math.pow(n.x-t.x,2)+Math.pow(n.y-t.y,2));
        f.x *= (d-100)*0.00005;
        f.y *= (d-100)*0.00005;
        n.x -= f.x;
        n.y -= f.y;
        t.x += f.x;
        t.y += f.y;
        nodes[tI] = t;
      }
    });
    nodes.forEach((t,tI) => {
      if(tI != i) {
        let f = {x:n.x-t.x, y:n.y-t.y};
        let d = Math.sqrt(Math.pow(n.x-t.x,2)+Math.pow(n.y-t.y,2));
        d += 10;
        f.x *= 200/Math.pow(d,3);
        f.y *= 200/Math.pow(d,3);
        n.x += f.x;
        n.y += f.y;
        t.x -= f.x;
        t.y -= f.y;
        nodes[tI] = t;
      }
    });
    /*if(n.x<0) n.x = 0;
    if(n.y<0) n.y = 0;
    if(n.x>s.x) n.x = s.x;
    if(n.y>s.y) n.y = s.y;*/
    nodes[i] = n;
  });
  //render();
}

setInterval(physics,100);
setInterval(render,50);

function addConnection(a,b) {
  addNode(b);
  let aNode = nodes[nodes.map(e=>e.u).indexOf(a)];
  if(!aNode.c.includes(b)) aNode.c.push(b);
}
function addNode(url,n=1) {
  if(!nodes.map(e=>e.u).includes(url)) {
    nodes.push({u:url,c:[],x:(Math.random()/n+(1-1/n)/2)*s.x,y:(Math.random()/n+(1-1/n)/2)*s.y,scanned:false});
  }
}