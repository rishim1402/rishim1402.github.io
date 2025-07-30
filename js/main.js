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
function drawScene1() {
  // 1. Prepare the data (filter by selectedMake if set)
  const data = selectedMake
    ? carData.filter(d => d.make === selectedMake)
    : carData;

  // 2. SVG container
  const svg = d3.select("#vis")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // 3. X scale for price
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.price))
    .nice()
    .range([0, width]);

  // 4. Compute histogram bins
  const bins = d3.bin()
      .domain(x.domain())
      .thresholds(30)          // 30 bins
      (data.map(d => d.price));

  // 5. Y scale for counts
  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, b => b.length)])
    .nice()
    .range([height, 0]);

  // 6. Draw histogram bars
  svg.selectAll("rect")
    .data(bins)
    .enter().append("rect")
      .attr("x", d => x(d.x0) + 1)
      .attr("y", d => y(d.length))
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("height", d => height - y(d.length))
      .attr("fill", "#69b3a2")
      .on("mouseover", (event, d) => {
        showTooltip(`${d.length} cars priced \$${Math.round(d.x0)}–\$${Math.round(d.x1)}`, event);
      })
      .on("mouseout", hideTooltip);

  // 7. Axes
  svg.append("g")
     .attr("transform", `translate(0,${height})`)
     .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("$.2s")));

  svg.append("g")
     .call(d3.axisLeft(y));

  // 8. Compute avg price by year for overlay line
  const avgByYear = Array.from(
    d3.rollup(data,
      v => d3.mean(v, d => d.price),
      d => d.year
    ),
    ([year, avg]) => ({ year, avg })
  ).sort((a, b) => a.year - b.year);

  // 9. X2 scale for year (mapped onto same pixel range as price)
  //    We’ll simply remap year extent to [0,width] for our line.
  const x2 = d3.scaleLinear()
    .domain(d3.extent(avgByYear, d => d.year))
    .range([0, width]);

  // 10. Y2 scale for avg price (reuse y)
  //      If avg price extends beyond our histogram y-domain, you can .nice() on it instead.

  // 11. Draw the average price line
  const line = d3.line()
    .x(d => x2(d.year))
    .y(d => y(d.avg));

  svg.append("path")
    .datum(avgByYear)
    .attr("fill", "none")
    .attr("stroke", "#ff7f0e")
    .attr("stroke-width", 2)
    .attr("d", line)
    .lower();  // send behind bars

  // 12. Annotation: median drop callout
  const median2015 = avgByYear.find(d => d.year === 2015)?.avg || 0;
  const median2005 = avgByYear.find(d => d.year === 2005)?.avg || 0;
  const dropPct = ((median2015 - median2005) / median2015 * 100).toFixed(0);

  const annotations = [
    {
      note: {
        title: `${dropPct}% drop`,
        label: `Avg price fell from \$${Math.round(median2015)} in 2015 to \$${Math.round(median2005)} in 2005`
      },
      x: x2(2010),                      // mid‐year position
      y: y((median2015 + median2005) / 2),
      dx: 40,
      dy: -30,
      subject: { radius: 4, radiusPadding: 8 }
    }
  ];

  svg.append("g")
     .attr("class", "annotation-group")
     .call(d3.annotation().annotations(annotations));

  // 13. Scene title
  svg.append("text")
     .attr("class", "scene-title")
     .attr("x", width / 2)
     .attr("y", -margin.top / 2)
     .attr("text-anchor", "middle")
     .text(selectedMake
       ? `Price distribution for ${selectedMake}`
       : "Price distribution for all makes"
     );
}

function drawScene2() { /* … */ }
function drawScene3() { /* … */ }

