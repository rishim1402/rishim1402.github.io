// PARAMETERS & STATE
let currentSlide = 0;
let selectedMake = null;
const slides = [drawScene1, drawScene2, drawScene3];

// DIMENSIONS
const margin = { top: 40, right: 20, bottom: 60, left: 60 };
const width  = 800 - margin.left - margin.right;
const height = 500 - margin.top  - margin.bottom;

// Load data and kick off
d3.csv("data/car_price.csv", d3.autoType).then(dataset => {
  window.carData = dataset;
  renderSlide(0);
});

// RENDER LOGIC
function renderSlide(idx) {
  currentSlide = idx;
  d3.select("#vis").html("");
  slides[idx]();      // call the appropriate scene-drawer
  updateControls();
}

// CONTROLS
function updateControls() {
  d3.select("#prevBtn").attr("disabled", currentSlide === 0 ? true : null);
  d3.select("#nextBtn").attr("disabled", currentSlide === slides.length - 1 ? true : null);
}
d3.select("#prevBtn").on("click", () => renderSlide(currentSlide - 1));
d3.select("#nextBtn").on("click", () => renderSlide(currentSlide + 1));

// TOOLTIP HELPERS
const tooltip = d3.select(".tooltip");
function showTooltip(html, event) {
  tooltip.html(html)
         .style("left", (event.pageX + 10) + "px")
         .style("top",  (event.pageY - 20) + "px")
         .transition().duration(200).style("opacity", 0.9);
}
function hideTooltip() {
  tooltip.transition().duration(200).style("opacity", 0);
}

// SCENE PLACEHOLDERS
function drawScene1() { /* … */ }
function drawScene2() { /* … */ }
function drawScene3() { /* … */ }

