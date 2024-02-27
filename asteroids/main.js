var asteroids,
bullets,
explosions,
pickups,
asteroidReload,
asteroidReloadTime,
size,
worldSize,
pause,
pauseKey,
pauseBtns,
oldBtns,
controls=1,
levelUp,
levelUpgrades,
player;
if(!localStorage.getItem("highscore")) {
  localStorage.setItem("highscore",3000);
}

function setup() {
  pause = false;
  pauseKey = false;
  levelUp = false;
  pauseBtns = [];
  oldBtns = [];
  asteroids = [];
  bullets = [];
  explosions = [];
  pickups = [];
  asteroidReload = 0;
  asteroidReloadTime = 250;
  asteroidSpeed = 2;
  worldSize = v(1500,1500);
  size = v(innerWidth,innerHeight);
  if(size.x>worldSize.x-10) size.x=worldSize.x-10;
  if(size.y>worldSize.y-10) size.y=worldSize.y-10;
  createCanvas(size.x,size.y);
  asteroids.push({pos:v(200,200),vel:v(3,2),size:40,hp:2});
  
  player = {};
  player.pos = v(0,0);
  player.vel = v(0,0);
  player.dir = 0;
  player.dV = 0;
  player.reload = 0;
  player.hp = 5;
  player.maxHp = 5;
  player.alive = true;
  player.restart = false;
  player.score = 0;
  player.iframe = 0;
  player.xp = 0;
  player.lvlUp = 50;
  player.lvl = 0;
  player.speed = 0.4;
  player.multishot = 1;
  player.reloadTime = 4;
  player.spread = 0.1;
  player.shield = false;
  frameRate(1000);
}

function draw() {
  if(!pause && !levelUp) {
    if(asteroidReload<=0) {
      asteroidReload = asteroidReloadTime;
      asteroidReloadTime*=0.95;
      if(asteroidReloadTime<30) asteroidReloadTime = 30;
      asteroidSpeed += 0.2;
      asteroids.push({
        pos:p5.Vector.add(player.pos,v(size.x/2,0).rotate(random()*2*PI-PI)),
        vel:v(random()*asteroidSpeed+asteroidSpeed,0).rotate(random()*2*PI-PI),
        size:40,hp:2});
    } else {
      asteroidReload-=0.03*deltaTime;
    }
    player.pos.add(p5.Vector.mult(player.vel,deltaTime*0.03));
    player.vel.mult(0.95);
    if(player.alive) {
      let joy = v(keyIsDown(68)-keyIsDown(65), keyIsDown(83)-keyIsDown(87)).normalize();
      if(controls==0) {
        let d = v(joy.y,0).rotate(player.dir).mult(-player.speed);
        player.vel.add(d);
        player.dV += joy.x*0.03;
        player.dir += player.dV*deltaTime*0.03;
        player.dV *= 0.9;
      } else if (controls==1) {
        player.vel.add(p5.Vector.mult(joy,player.speed+0.1));
        player.dir = p5.Vector.sub(v(mouseX,mouseY),p5.Vector.div(size,2)).heading();
      }
      player.iframe-=deltaTime*0.03;
      if(player.pos.x>worldSize.x/2) {
        player.pos.x -= worldSize.x;
      }
      if(player.pos.y>worldSize.y/2) {
        player.pos.y -= worldSize.y;
      }
      if(player.pos.x<-worldSize.x/2) {
        player.pos.x += worldSize.x;
      }
      if(player.pos.y<-worldSize.y/2) {
        player.pos.y += worldSize.y;
      }
      if(player.hp>player.maxHp) player.hp = player.maxHp;
      if(player.xp>player.lvlUp) {
        player.lvl++;
        player.xp -=player.lvlUp;
        player.lvlUp *= 1.05;
        player.lvlUp += 10;
        player.score += 1000;
        levelUp = true;
        let options = [
          {name:"Speed",f:()=>player.speed+=0.2,weight:1},
          {name:"Multishot",f:()=>player.multishot+=0.5,weight:0.3},
          {name:"Reload",f:()=>player.reloadTime*=0.85,weight:0.8},
          {name:"Health",f:()=>player.maxHp++,weight:0.9}
        ];
        let choices = [];
        options.forEach((e) => {
          for(let n = 0; n < e.weight*20; n++) {
            choices.push({name:e.name,f:e.f});
          }
        });
        levelUpgrades = [];
        for(let n = 0; n < 3; n++) {
          let r = floor(random()*choices.length);
          levelUpgrades.push(choices[r]);
          choices = choices.filter(e=>e.name!=choices[r].name);
        }
      }
      if((keyIsDown(32) || mouseIsPressed) && player.reload<=0) {
        let n = round(player.multishot);
        let t = player.spread;
        for(let i = 0; i < n; i++) {
          bullets.push({
            pos:player.pos.copy(),
            vel:p5.Vector.add(player.vel,v(20,0) .rotate(player.dir+i*t-t*(n-1)/2)),
            dst:v(0,0)
          });
          bullets[bullets.length-1].pos.add(p5.Vector.sub(bullets[bullets.length-1].vel,player.vel));
        }
        player.reload = player.reloadTime;
      } else {
        player.reload-=deltaTime*0.03;
      }
      if(player.hp<=0) {
        player.alive = false;
        explosions.push({pos:player.pos.copy(),vel:player.vel.copy(),size:20,tick:0});
        bullets = [];
        if(player.score>=parseInt(localStorage.getItem("highscore"))) localStorage.setItem("highscore",player.score);
      }
    }

    asteroids.forEach((e,i) => {
      e.pos.add(e.vel);
      if(e.pos.x>worldSize.x/2) {
        e.pos.x -= worldSize.x;
      }
      if(e.pos.y>worldSize.y/2) {
        e.pos.y -= worldSize.y;
      }
      if(e.pos.x<-worldSize.x/2) {
        e.pos.x += worldSize.x;
      }
      if(e.pos.y<-worldSize.y/2) {
        e.pos.y += worldSize.y;
      }
      
      if(player.alive) {
        let d = p5.Vector.sub(e.pos,player.pos);
        if(d.mag()<e.size+15) {
          if(player.iframe<=0) {
            player.hp--;
            e.hp--;
          }
          player.iframe = 10;
          d = d.normalize();
          d.mult(e.size+15);
          e.pos = player.pos.copy();
          e.pos.add(d);
          e.vel.sub(player.vel);
          e.vel.reflect(d);
          e.pos.add(e.vel);
          e.vel.add(player.vel);
          if(e.hp<=0) {
            astSplit(e.pos,d.heading()+PI,e.size,e.vel,e.size+15);
            asteroids.splice(i,1);
            i--;
          }
        }
      }
    });
    bullets.forEach((e,i) => {
      e.pos.add(p5.Vector.mult(e.vel,deltaTime*0.03));
      e.dst.add(p5.Vector.mult(e.vel,deltaTime*0.03));
      let s = -e.vel.mag();
      if(e.dst.x>worldSize.x/2+s || e.dst.y>worldSize.y/2+s || e.dst.x<-worldSize.x/2-s || e.dst.y<-worldSize.y/2-s) {
        bullets.splice(i,1);
      } else {
        if(e.pos.x>worldSize.x/2) {
          e.pos.x -= worldSize.x;
        }
        if(e.pos.y>worldSize.y/2) {
          e.pos.y -= worldSize.y;
        }
        if(e.pos.x<-worldSize.x/2) {
          e.pos.x += worldSize.x;
        }
        if(e.pos.y<-worldSize.y/2) {
          e.pos.y += worldSize.y;
        }
        asteroids.forEach((t,ti) => {
          let d = p5.Vector.sub(e.pos,t.pos);
          if(d.mag()<t.size+5) {
            bullets.splice(i,1);
            i--;
            t.hp--;
            if(t.hp<=0) {
              astSplit(t.pos.copy(),e.vel.heading(),t.size,t.vel.copy(),t.size);
              asteroids.splice(ti,1);
              ti--;
            }
          }
        });
      }
    });
    explosions.forEach((e,i) => {
      e.tick+=deltaTime*0.03;
      if(e.tick>=2+e.size/4) {
        explosions.splice(i,1);
      }
    });
  }
  if(keyIsDown(27)&&!pauseKey) {
    pause = !pause;
  }
  if(levelUp) {
    pause=false;
  }
  
  background(0);
  stroke(150);
  strokeWeight(1);
  let s = 100;
  for(let x = (Math.round(s-player.pos.x)%s+s)%s; x <= size.x; x+=s) {
    line(x,0,x,size.y);
  }
  for(let y = (Math.round(s-player.pos.y)%s+s)%s; y <= size.y; y+=s) {
    line(0,y,size.x,y);
  }
  stroke(255);
  strokeWeight(5);
  noFill();
  push();
  translate(size.x/2,size.y/2);
  push();
  translate(-player.pos.x,-player.pos.y);
  for(let xOff=-worldSize.x; xOff<=worldSize.x; xOff+=worldSize.x) {
    for(let yOff=-worldSize.y; yOff<=worldSize.y; yOff+=worldSize.y) {
      push();
      translate(xOff,yOff);
      explosions.forEach((e,i) => {
        fill(255);
        stroke(255);
        stroke(200);
        ellipse(e.pos.x,e.pos.y,e.tick*e.size,e.tick*e.size);
      });
      stroke(255);
      strokeWeight(5);
      noFill();
      asteroids.forEach((e) => {
        ellipse(e.pos.x,e.pos.y,e.size,e.size);
      });
      bullets.forEach((e) => {
        line(e.pos.x, e.pos.y, e.pos.x-(e.vel.x-player.vel.x), e.pos.y-(e.vel.y-player.vel.y));
      });
      pickups.forEach((e,i) => {
        if(e.type==0) fill("rgb(220,50,0)");
        if(e.type==1) fill("rgb(50,150,250)");
        circle(e.pos.x,e.pos.y,20);
        let pos = p5.Vector.add(e.pos,v(xOff,yOff));
        if(p5.Vector.sub(pos,player.pos).mag()<=50) {
          pickups.splice(i,1);
          if(e.type==0) player.hp++;
          if(e.type==1) player.shield=true;
        }
      });
      pop();
    }
  }
  pop();
  if(player.alive) {
    push();
    rotate(player.dir);
    push();
    if(controls==0) {
      strokeWeight(2);
      for(let d = 30; d < 500; d+=10) {
        stroke("rgba(255,255,255,"+75/(d+60)+")");
        line(d,0,d+5,0);
      }
    }
    pop();
    if(player.iframe>0) fill(255);
    else fill(0);
    triangle(-15,-15,-15,15,20,0);
    pop();
  }
  pop();
  if(player.alive) {
    for(let i = 0; i < player.maxHp; i++) {
      fill(player.hp>=(i+1)?255:0);
      stroke(255);
      strokeWeight(4);
      ellipse(30+i*35,30,20,20);
    }
    
    fill(255);
    stroke(255);
    strokeWeight(1);
    textSize(20);
    textAlign(LEFT);
    textFont("monospace");
    textStyle(NORMAL);
    text(player.score,20,90);
    text("Level "+(player.lvl+1),20,110);
    
    fill(0);
    stroke(255);
    strokeWeight(2);
    rect(20,54,160,10);
    fill(255);
    rect(20,54,160*player.xp/player.lvlUp,10);
    
    fill("rgba(0,0,0,0.5)");
    stroke(250);
    strokeWeight(3);
    rect(size.x-160,size.y-160,150,150);
    push();
    translate(size.x-85,size.y-85);
    scale(150/worldSize.x);
    
    strokeWeight(10);
    fill("rgba(0,0,0,0.5)");
    for(let x = -worldSize.x; x <= worldSize.x; x+=worldSize.x) {
      for(let y = -worldSize.y; y <= worldSize.y; y+=worldSize.y) {
        let x1 = player.pos.x-size.x/2+x;
        if(x1>worldSize.x/2) x1 = worldSize.x/2;
        if(x1<-worldSize.x/2) x1 = -worldSize.x/2;
        let y1 = player.pos.y-size.y/2+y;
        if(y1>worldSize.y/2) y1 = worldSize.y/2;
        if(y1<-worldSize.y/2) y1 = -worldSize.y/2;
        let x2 = player.pos.x+size.x/2+x;
        if(x2>worldSize.x/2) x2 = worldSize.x/2;
        if(x2<-worldSize.x/2) x2 = -worldSize.x/2;
        let y2 = player.pos.y+size.y/2+y;
        if(y2>worldSize.y/2) y2 = worldSize.y/2;
        if(y2<-worldSize.y/2) y2 = -worldSize.y/2;
        rect(x1,y1,x2-x1,y2-y1);
      }
    }
    
    strokeWeight(5);
    fill(255);
    asteroids.forEach((e) => {
      ellipse(e.pos.x,e.pos.y,e.size,e.size);
    });
    push();
    translate(player.pos);
    rotate(player.dir);
    triangle(-20,-25,-20,25,35,0);
    pop();
    pop();
  } else {
    fill(255);
    stroke(0);
    strokeWeight(5);
    textAlign(CENTER);
    textStyle(BOLD);
    textFont("monospace");
    textSize(70);
    text("You Died",size.x/2,size.y/2-30);
    textSize(30);
    if(player.score>=parseInt(localStorage.getItem("highscore"))) {
      text("New highscore! "+player.score,size.x/2,size.y/2+20);
      text("Press space to restart",size.x/2,size.y/2+60);
    } else {
      text("Your score: "+player.score,size.x/2,size.y/2+20);
      text("Highscore: "+localStorage.getItem("highscore"),size.x/2,size.y/2+60);
      text("Press space to restart",size.x/2,size.y/2+100);
    }
    if(keyIsDown(32) && !player.restart) {
      setup();
    }
  }
  
  if(pause||levelUp) {
    fill("rgba(0,0,0,0.5)");
    noStroke();
    rect(0,0,size.x,size.y);
    
    stroke(0);
    strokeWeight(0);
    pauseBtns = [];
    if(pause) {
      button("Resume",120,0,0,() => {
        pause = false;
      });
      let controlLayouts = ["AD Turning","Mouse+WASD"];
      button(controlLayouts[controls],210,1,0,() => {
        controls++;
        if(controls>controlLayouts.length-1) {
          controls-=controlLayouts.length;
        }
      });
      button("Quit",260,2,0,() => {
        player.hp = 0;
      });
      textSize(25);
      text("Control Layout:",size.x/2,200);
      
      textSize(40);
      textAlign(CENTER);
      textStyle(NORMAL);
      textFont("monospace");
      fill(255);
      stroke(255);
      strokeWeight(1);
      text("Paused",size.x/2,100);
    }
    if(levelUp) {
      textSize(40);
      textAlign(CENTER);
      textStyle(NORMAL);
      textFont("monospace");
      fill(255);
      stroke(255);
      strokeWeight(1);
      text("Level Up!",size.x/2,100);
      levelUpgrades.forEach((e,i) => {
        button(e.name,120+i*50,i,1,() => {
          e.f();
          levelUp = false;
        });
      });
    }
    oldBtns = pauseBtns;
  }
  fill(255);
  stroke(255);
  strokeWeight(0.5);
  textSize(15);
  textAlign(RIGHT);
  textFont("monospace");
  textStyle(NORMAL);
  text(round(1000/deltaTime),size.x-10,20);
  
  
  stroke(250);
  strokeWeight(4);
  push();
  translate(mouseX,mouseY);
  if(controls==1 && !pause && !levelUp) {
    line(-15,-10,-10,-15);
    line(15,10,10,15);
    line(-15,10,-10,15);
    line(15,-10,10,-15);
    line(-5,0,5,0);
    line(0,-5,0,5);
    canvas.style.cursor = "none";
  } else {
    canvas.style.cursor = "unset";
  }
  pop();
  
  player.restart = keyIsDown(32);
  pauseKey = keyIsDown(27);
}
function v(x,y) {
  return createVector(x,y);
}
function astSplit(pos,dir,size,vel,dst) {
  explosions.push({pos:pos.copy(),vel:vel.copy(),tick:0,size:size/3});
  player.score += size>35?150:(size>25?100:75);
  player.xp += size>35?2:1;
  if(size>35 && random()>0.5) {
    asteroidReload = 0;
    if(random()>0.5) {
      pickups.push({type:floor(random()*2),pos:pos});
    }
  }
  if(size>=25) {
    let num = 3;//+Math.round(random());
    for(let i = -1; i<=1; i+=2/(num-1)) {
      asteroids.push({
        pos:pos.copy(),
        vel:p5.Vector.add(vel, v(3,0) .rotate(dir+i)),
        size:size/4*3,
        hp:1
      });
      asteroids[asteroids.length-1].pos.add(
        p5.Vector.mult(p5.Vector.sub(asteroids[asteroids.length-1].vel,vel),dst/6)
      );
    }
  }
}
function button(txt,yPos,i,style,fun) {
  textSize(30);
  textAlign(CENTER);
  textStyle(NORMAL);
  textFont("monospace");
  let w = textWidth(txt)+15;
  let hover = (mouseX>size.x/2-w/2&&mouseY>yPos && mouseX<size.x/2+w/2&&mouseY<yPos+40);
  pauseBtns.push(hover&&mouseIsPressed);
  fill(hover?130:110);
  rect(size.x/2-w/2,yPos,w,40,10);
  fill(255);
  text(txt,size.x/2,yPos+30);
  if(hover&&mouseIsPressed&&!oldBtns[i]) {
    fun();
  }
}
window.onblur = () => {
  if(!levelUp) pause = true;
}
