let kCanvas = {
  "w": $("#canvas").width(),
  "h": $("#canvas").height()
}

let kChart = {
  "x": 36,
  "y": 50,
  "w": kCanvas.w - 44,
  "h": kCanvas.h - 140
}

let kColors = {
  "lineAverage": "#fff3cd",
  "lineSelectedPref": "#FFAA92",
  "lineOtherPref": [100, 250, 200, 90],
  "map": "#C7FFD2,#FFE9E0,#FFEEE9,#FFD9CF,#FFC0AE,#FFAA92,#FF9274,#EC7555,#EC2267".split(",")
};

let kData;
let MIN_YEAR = 1999;
let VERTICAL_NUM = 4;
let VALUE_MIN = 0;
let VALUE_MAX = 80;
let selectedPrefCode = null;
let imgLogo;
let kYears = ["1999","2002","2005","2008","2011","2015"];


function addCommas(num){
  return String(num).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
}


function map(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}


// Refer to: https://forum.processing.org/two/discussion/13585/drawing-dotted-line-around-a-rect-ie-dotted-stroke
function dottedLine(x1, y1, x2, y2){
  var l = 1;
  var g = 1;
  var c = 150;

  var pc = dist(x1, y1, x2, y2) / c;
  var pcCount = 1;
  var lPercent = gPercent = 0;
  var currentPos = 0;
  var xx1 = yy1 = xx2 = yy2 = 0;

  while (int(pcCount * pc) < l) {
      pcCount++
  }
  lPercent = pcCount;
  pcCount = 1;
  while (int(pcCount * pc) < g) {
      pcCount++
  }
  gPercent = pcCount;

  lPercent = lPercent / c
  gPercent = gPercent / c;
  while (currentPos < 1) {
    xx1 = lerp(x1, x2, currentPos);
    yy1 = lerp(y1, y2, currentPos);
    xx2 = lerp(x1, x2, currentPos + lPercent);
    yy2 = lerp(y1, y2, currentPos + lPercent);
    if (x1 > x2) {
        if (xx2 < x2) {
            xx2 = x2;
        }
    }
    if (x1 < x2) {
        if (xx2 > x2) {
            xx2 = x2;
        }
    }
    if (y1 > y2) {
        if (yy2 < y2) {
            yy2 = y2;
        }
    }
    if (y1 < y2) {
        if (yy2 > y2) {
            yy2 = y2;
        }
    }

    line(xx1, yy1, xx2, yy2);
    currentPos = currentPos + lPercent + gPercent;
  }
}


function preload() {
  imgLogo = loadImage('../../assets/img/logo-tko-white.png');
}


function setup() {
  var canvas = createCanvas(kCanvas.w, kCanvas.h);
  canvas.parent('canvas');

  pixelDensity(2.0);
  frameRate(0);
  textFont("Helvetica Neue, Arial, Noto Sans Japanese");

  $.getJSON("data/data.json", function(data){
    kData = data;
    draw();
    initMap();
  });
}


function draw(){
  background("#234");
  drawTitle();
  drawYears();
  drawBaseLines();
  drawValueLines();
  drawLegend();
  drawNotes();
  drawLogo();
}


function drawNotes(){
  let tx = 4;
  let ty = kCanvas.h - 4;

  textSize(9);
  textAlign(LEFT, BOTTOM);
  noStroke();
  fill("#aaa");
  text("出所：文部科学省「社会教育調査」。\n専任＋兼任＋非常勤に占める非常勤の割合。\n指定管理者の職員は含まない。\n調査周期は原則3年だが2015年度は1年延期された。", tx, ty);
}


function drawLogo(){
  let imgW = 848 / 6.5;
  let imgH = 320 / 6.5;
  image(imgLogo, kCanvas.w - imgW, kCanvas.h - imgH, imgW, imgH);
}


function drawTitle(){
  let tx = 4;
  let ty = 4;
  textSize(16);
  textAlign(LEFT, TOP);
  noStroke();
  fill("#fafafa");
  text("都道府県別「図書館司書」の非正規雇用", tx, ty);
}


function gotoBlock(place){
  let $target = $("#" + place + "-block");
  let $navi   = $("#map-block").find(".navigation");
      if (place === "map") $navi = $("#canvas-block").find(".navigation");

  let isFirst = false;
  if ($navi.hasClass("show")) {
    isFirst = true;
    $navi.removeClass("show");
  }

  let timeout  = (isFirst && place === "canvas") ? 400 : 0;
  let duration = (isFirst) ? 1200 : 600;
  let position = $target.offset().top - 24;

  setTimeout(function(){
    $("html, body").animate({scrollTop: position}, duration, "swing");
  }, timeout);

  updateDataTable();
}


function updateDataTable(){
  let code  = (selectedPrefCode) ? selectedPrefCode : "48";
  let index = $(".touch-area").index($(".selected"));
  let year  = kData[code][index];

  $("#dt-year").text(kYears[index]);
  $("#dt-pref").text(getPrefName(code));

  $("#dt-m-f").text(addCommas(year.M[0]));
  $("#dt-m-a").text(addCommas(year.M[1]));
  $("#dt-m-p").text(addCommas(year.M[2]));
  $("#dt-m-t").text(addCommas(year.M[0] + year.M[1] + year.M[2]));
  $("#dt-m-r").text(((year.M[2] / (year.M[0] + year.M[1] + year.M[2])) * 100).toFixed(1) + "%");

  $("#dt-f-f").text(addCommas(year.F[0]));
  $("#dt-f-a").text(addCommas(year.F[1]));
  $("#dt-f-p").text(addCommas(year.F[2]));
  $("#dt-f-t").text(addCommas(year.F[0] + year.F[1] + year.F[2]));
  $("#dt-f-r").text(((year.F[2] / (year.F[0] + year.F[1] + year.F[2])) * 100).toFixed(1) + "%");

  $("#dt-t-f").text(addCommas(year.F[0] + year.M[0]));
  $("#dt-t-a").text(addCommas(year.F[1] + year.M[1]));
  $("#dt-t-p").text(addCommas(year.F[2] + year.M[2]));
  $("#dt-t-t").text(addCommas(year.F[0] + year.F[1] + year.F[2] + year.M[0] + year.M[1] + year.M[2]));
  $("#dt-t-r").text((((year.M[2] + year.F[2]) / (year.M[0] + year.M[1] + year.M[2] + year.F[0] + year.F[1] + year.F[2])) * 100).toFixed(1) + "%");
}


function getValue(year){
  let total = year.F[0] + year.F[1] + year.F[2] + year.M[0] + year.M[1] + year.M[2];
  let part  = year.F[2] + year.M[2];
  let value = ((part / total) * 100).toFixed(1);
  return value;
}


function setPreferences(type){

  if (type === "text-legend") {
    noStroke();
    fill("#fafafa");
    textSize(13);
    textAlign(LEFT, BOTTOM);

  } else if (type === "line-average") {
    noFill();
    strokeWeight(4);
    stroke(color(kColors.lineAverage));

  } else if (type === "line-selectedPref") {
    noFill();
    strokeWeight(4);
    stroke(color(kColors.lineSelectedPref));

  } else if (type === "line-otherPref") {
    noFill();
    strokeWeight(1);
    stroke(color(kColors.lineOtherPref));
  }
}


function drawLegend(){
  let tx  = kChart.x + kChart.w - 108;
  let ty1 = kChart.y + kChart.h - 12;
  let ty2 = ty1 - 20;
  let ty3 = ty2 - 20;


  setPreferences("text-legend");
  text("その他の都道府県",  tx, ty1);
  text("全国",        tx, ty2);

  setPreferences("line-otherPref");
  line(tx - 20, ty1 - 6, tx - 8, ty1 - 6);

  setPreferences("line-average");
  line(tx - 20, ty2 - 6, tx - 8, ty2 - 6);

  if (selectedPrefCode) {
    setPreferences("text-legend");
    text(getPrefName(selectedPrefCode), tx, ty3);

    setPreferences("line-selectedPref");
    line(tx - 20, ty3 - 6, tx - 8, ty3 - 6);
  }
}


function getColor(v){
  let sf = parseInt(v / 10);
  return kColors.map[sf];
}


function drawValueLines(){
  for (code in kData) {
    drawValueLine(code, "other");
  }

  // Average
  drawValueLine("48", "average");

  // Selected prefecture
  if (selectedPrefCode) drawValueLine(selectedPrefCode, "selected");
}


function drawValueLine(code, type){
  let pi = 0;
  beginShape();

  kData[code].forEach(function(year) {
    let value = getValue(year);

    let lx = kChart.x + (pi * (kChart.w / (kYears.length - 1)));
    let ly = map(value, VALUE_MIN, VALUE_MAX, kChart.y + kChart.h, kChart.y);

    if (type === "other")    setPreferences("line-otherPref");
    if (type === "average")  setPreferences("line-average");
    if (type === "selected") setPreferences("line-selectedPref");

    vertex(lx, ly);
    pi++;
  });

  endShape();
}


function drawYears(){
  for (let i = 0; i < kYears.length; i++) {
    let tx = map(i, 0, kYears.length - 1, 0, kChart.w) + kChart.x;
    let ty = kChart.y + kChart.h;

    noFill();
    strokeWeight(1);
    stroke("#eee");
    line(tx, ty - 8, tx, ty + 8);

    noStroke();
    fill("#ddd");
    textSize(12);
    textAlign(CENTER, TOP);
        if (i === 0)                 tx += 12;
        if (i === kYears.length - 1) tx -= 11;
    text(kYears[i], tx, ty + 16);
  }
}


function drawBaseLines(){

  // Base line
  strokeWeight(2);
  stroke(255, 200);
  noFill();
  line(kChart.x, kChart.y + kChart.h, kChart.x + kChart.w, kChart.y + kChart.h);


  for(let i = 0; i <= VERTICAL_NUM; i++){
    let dy = map(i, 0, VERTICAL_NUM, kChart.y, kChart.y + kChart.h);

    // Dotted line
    strokeWeight(1);
    stroke(255, 60);
    dottedLine(kChart.x, dy, kChart.x + kChart.w, dy);

    // Label on left side: number
    noStroke();
    fill(255, 200);
    textAlign(RIGHT, CENTER);
    textSize(14);
    text((VALUE_MAX - (i * 20)), kChart.x - 15, dy);

    // Label on left side: "%"
    fill(255, 100);
    textSize(11);
    text("%", kChart.x - 2, dy + 1);
  }
}


function getPrefName(code){
  let i = parseInt(code) - 1;
  let prefs = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県","全国"];
  return prefs[i];
}


function initMap(){
  const width  = $("#map").width();
  const height = $("#map").height();

  let scale = 1000;
  let projection = d3.geoMercator()
      .center([137, 36])
      .scale(scale)
      .translate([width * 0.5, height * 0.5]);

  let path = d3.geoPath().projection(projection);

  let svg = d3.select("#map")
      .attr("width", width)
      .attr("height", height);

  d3.json("../../assets/topojson/001/prefectures.topojson").then(function(values) {
      let map = svg.selectAll("path")
        .data(topojson.feature(values, values.objects["-"]).features)
        .enter()
        .append("path")
        .attr("fill", "rgb(255, 255, 255)")
        .attr("stroke", "rgba(255, 255, 255,0.1)")
        .attr("stroke-width", "0.1")
        .attr("d", path)
        .attr("class", "pref")
        .on('click tap touch', function(d, i){
          let code = d.properties["iso_3166_2"].replace("JP-", "");
          selectedPrefCode = code;
          updateMapColors();
          draw();
          d3.select(this).attr('fill', "yellow");
          gotoBlock("canvas");
        });

      $(".touch-area").eq(5).addClass("selected");
      updateMapColors();
      updateDataTable();

      // ドラッグイベント設定
      let drag = d3.drag().on("drag", function(){
        let prjtrs = projection.translate();
        projection.translate([prjtrs[0] + d3.event.dx, prjtrs[1] + d3.event.dy]);
        map.attr('d', path);
      });

      // ズームイベント設定
      let zoom = d3.zoom().on("zoom", function(){
        map.attr("transform", d3.event.transform);
      });

      svg.call(drag);
      svg.call(zoom);
  });

  // Add map legend
  $legend = $("#map-legend");
  let ci = 0;
  kColors.map.forEach(function(c) {
    let min = (ci * 10).toString();
    let max = ((ci + 1) * 10).toString();
    let txt = min + "% - " + max + "%";
    let html =  '<li>'
                + '<div class="circle" style="background-color:' + c + ';"></div>'
                + txt
              + '</li>';
    $legend.prepend(html);
    ci++;
  });
}


function updateMapColors(){
  let areai = $(".touch-area").index($(".selected"));

  var svg = d3.select("#map");
  svg.selectAll("path")
      .attr("fill", function (d, i) {
        let code = d.properties["iso_3166_2"].replace("JP-", "");
        let c = getColor(getValue(kData[code][areai]));
        return c;
      });

  $("#map-year-num").text(kYears[areai]);
}


$(function(){
  $(".touch-area").on("click", function(){
    $(".touch-area").removeClass("selected");
    $(this).addClass("selected");
    draw();
    updateMapColors();
    gotoBlock("map");
  });

  $(document).on("click", function(e) {
    if (  !$(e.target).closest('.pref').length
      &&  !$(e.target).closest('#canvas').length
      &&  !$(e.target).closest('#button-download-image').length) {
      selectedPrefCode = null;
      draw();
      updateMapColors();
      updateDataTable();
    }
  });

  $("#button-download-image").on("click", function() {
    saveCanvas("toyokeizai-online", "png");
  });
});
