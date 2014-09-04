$.init = function() {
  $.input = $.Input;
  $.input.bind([13, 32, 65, 37, 38, 39, 40, 49, 50, 51, 52]);
  $.cfg = document.getElementById('fg');
  $.cv1 = document.createElement("canvas");
  $.cv2 = document.createElement("canvas");
  // Game over messages
  $.goMsg = ['Oh, the humanity!', 'That\'s all folks', 'We\'re doomed!', 'And there goes the humanity'];
  $.scene = new $.Scene();

  $.showWelcome();
};

$.showWelcome = function() {
  $.input.update();
  $.quitScenes();
  document.getElementById('s').style.visibility = 'visible';
  $.scene = new $.Scene();
  $.welcomeLoop();
};

$.showIntro = function() {
  $.input.update();
  $.quitScenes();
  document.getElementById('i').style.visibility = 'visible';
  $.scene = new $.Scene();
  $.util.show('i0');
  $.introLoop();
};

$.showGameOver = function() {
  $.input.update();
  $.quitScenes();
  document.getElementById('g1').innerHTML = $.goMsg[$.util.randInt(0, $.goMsg.length)];
  document.getElementById('g').style.visibility = 'visible';
  $.gameOverLoop();
};

$.welcomeLoop = function() {
  if ($.input.isReleased(13)) return $.showIntro();

  $.scene.elapsed = Date.now() - $.scene.ctime;
  if ($.scene.elapsed > 400) {
    $.scene.ctime = Date.now();
    $.scene.elapsed = 0;
    if ($.scene.step === 0) {
      $.scene.step = 1;
      document.getElementById('s1').style.visibility = 'hidden';
    } else {
      $.scene.step = 0;
      document.getElementById('s1').style.visibility = 'visible';
    }
  }
  $.input.update();
  requestAnimationFrame($.welcomeLoop);
};

$.introLoop = function() {
  if ($.input.isReleased(13)) return $.startGame();
  if ($.scene.step > 7) return $.startGame();

  $.scene.elapsed = Date.now() - $.scene.ctime;
  if ($.scene.elapsed >= 1800 && !$.scene.fading) {
    $.scene.fading = 1;
    $.util.fadeOut('i' + $.scene.step, function() {
      $.scene.step += 1;
      $.scene.ctime = Date.now();
      $.scene.elapsed = 0;
      $.scene.fading = 0;
      $.util.show('i' + $.scene.step);
    });
  }

  $.input.update();
  requestAnimationFrame($.introLoop);
};

$.gameOverLoop = function() {
  if ($.input.isReleased(13)) return $.startGame();
  $.input.update();
  requestAnimationFrame($.gameOverLoop);
};

$.quitScenes = function() {
  document.getElementById('s').style.visibility = 'hidden';
  document.getElementById('s1').style.visibility = 'hidden';
  document.getElementById('i').style.visibility = 'hidden';
  document.getElementById('g').style.visibility = 'hidden';
};

$.startGame = function() {
  $.quitScenes();
  $.ctxfg = $.cfg.getContext('2d');
  $.ctx1 = $.cv1.getContext('2d');
  $.ctx2 = $.cv2.getContext('2d');
  $.vw = $.cfg.width = $.cv1.width = $.cv2.width = 640;
  $.vh = $.cfg.height = $.cv1.height = $.cv2.height = 480;
  $.ww = 800;
  $.wh = 800;
  $.ofx = 0;
  $.ofy = 0;
  $.fow = new $.FoW(2);
  $.cam = new $.Camera(640, 480);
  $.collide = new $.Collide();
  $.hud = new $.Hud();

  $.tiles = [];
  for (var i = 0; i < $.ww / 32; i++) {
    $.tiles.push([]);
    for (var j = 0; j < $.wh / 32; j++) {
      $.tiles[i].push(0);
    }
  }

  $.hero = new $.Hero(40, 50);
  $.walls = [new $.Wall(384, 384), new $.Wall(160, 416)];
  $.enemies = [new $.Zombie(256, 60)];
  $.textPops = [];
  $.tiles[12][12] = 1;
  $.tiles[5][13] = 1;
  for (i = 0; i < 5; i++) {
    $.tiles[3 + i][3] = 1;
    $.tiles[8][3 + i] = 1;
    $.walls.push(new $.Wall(96 + (32 * i), 96, 0));
    $.walls.push(new $.Wall(256, 96 + (32 * i), 0));
  }

  for (i = 0; i < $.ww / 32; i++) {
    $.tiles[i][0] = 1;
    $.tiles[i][(800 - 32) / 32] = 1;
    $.tiles[0][i] = 1;
    $.tiles[(800 - 32) / 32][i] = 1;
    $.walls.push(new $.Wall(i * 32, 0, 1));
    $.walls.push(new $.Wall(i * 32, 800 - 32, 1));
    $.walls.push(new $.Wall(0, i * 32, 1));
    $.walls.push(new $.Wall(800 - 32, i * 32, 1));
  }

  // Map visualization
  //var st = [];
  //for (i = 0; i < $.wh / 32; i++) {
  //  st = [];
  //  for (var h = 0; h < $.ww / 32; h++) {
  //    st.push($.tiles[h][i]);
  //  }
  //  console.log(i, st.join(' '));
  //}

  $.powerGrp = [];

  $.loop();
};

$.clearFg = function() {
  $.ctxfg.clearRect(0, 0, $.vw, $.vh);
  $.ctxfg.fillStyle = 'hsl(326, 18%, 25%)';
  $.ctxfg.fillRect(0, 0, $.vw, $.vh);
};

$.loop = function() {
  $.clearFg();

  /* Update */
  $.hero.update();
  $.powerGrp.forEach(function(p, i) {
    p.update(i);
  });
  $.enemies.forEach(function(e, i) {
    e.update(i);
  });
  $.textPops.forEach(function(t, i) {
    t.update(i);
  });
  var fow = $.fow.update();
  //$.cam.setTarget($.hero);
  $.cam.ofx = $.ofx;
  $.cam.ofy = $.ofy;

  /* Render */
  $.cam.render($.walls);
  $.cam.render($.enemies);
  $.hero.render();
  $.cam.render($.powerGrp);
  $.cam.render($.textPops);

  /* Fog of War */
  $.ctx1.fillStyle = "rgba(0,0,0,1)";
  $.ctx1.fillRect(0, 0, $.vw, $.vh);
  $.ctx2.clearRect(0, 0, $.vw, $.vh);
  for (i=fow.length; i--;) {
    $.ctx2.fillStyle = (fow[i][2] === 0) ? "rgb(255,255,255)" : "rgba(255,255,255,0.85)";
    $.ctx2.fillRect((fow[i][0] * 32) - $.ofx, (fow[i][1] * 32) - $.ofy, 33, 33);
  }

  $.ctx1.save();
  $.ctx1.globalCompositeOperation = 'destination-out';
  $.ctx1.drawImage($.cv2, 0, 0, $.vw, $.vh);
  $.ctx1.restore();
  //$.ctxfg.drawImage($.cv1,0, 0, $.vw, $.vh);


  //console.log(xx, yy);
  //console.log(fow);
  //console.log('******************');


  $.hud.render();

  requestAnimationFrame($.loop);
};

/* Start game on load */
window.addEventListener('load', function() {
  $.init();
});
