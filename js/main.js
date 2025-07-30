// PARAMETERS & STATE
let currentSlide = 0;
let selectedMakes = [];
let selectedStates = [];
const slides = [drawScene1, drawScene2, drawScene3];

// DIMENSIONS
const margin = { top: 60, right: 80, bottom: 80, left: 80 };
const width = 900 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Load data and kick off
d3.csv("data/car_price.csv", d3.autoType).then(dataset => {
  window.carData = dataset;
  populateFilters();
  renderSlide(0);
});

// FILTER SETUP
function populateFilters() {
  // Populate make checkboxes
  const makes = Array.from(new Set(carData.map(d => d.make))).sort();
  const makeContainer = d3.select("#makeCheckboxes");
  makeContainer.selectAll("*").remove();
  
  const makeItems = makeContainer.selectAll(".checkbox-item")
    .data(makes)
    .enter()
    .append("div")
    .attr("class", "checkbox-item");
  
  makeItems.append("input")
    .attr("type", "checkbox")
    .attr("id", d => `make-${d}`)
    .attr("value", d => d)
    .on("change", updateMakeFilters);
  
  makeItems.append("label")
    .attr("for", d => `make-${d}`)
    .text(d => d);

  // Populate state checkboxes
  const states = Array.from(new Set(carData.map(d => d.state))).sort();
  const stateContainer = d3.select("#stateCheckboxes");
  stateContainer.selectAll("*").remove();
  
  const stateItems = stateContainer.selectAll(".checkbox-item")
    .data(states)
    .enter()
    .append("div")
    .attr("class", "checkbox-item");
  
  stateItems.append("input")
    .attr("type", "checkbox")
    .attr("id", d => `state-${d}`)
    .attr("value", d => d)
    .on("change", updateStateFilters);
  
  stateItems.append("label")
    .attr("for", d => `state-${d}`)
    .text(d => d);

  // Clear filters button
  d3.select("#clearFilters").on("click", function() {
    selectedMakes = [];
    selectedStates = [];
    d3.selectAll("#makeCheckboxes input").property("checked", false);
    d3.selectAll("#stateCheckboxes input").property("checked", false);
    renderSlide(currentSlide);
  });
}

function updateMakeFilters() {
  selectedMakes = [];
  d3.selectAll("#makeCheckboxes input:checked").each(function() {
    selectedMakes.push(this.value);
  });
  renderSlide(currentSlide);
}

function updateStateFilters() {
  selectedStates = [];
  d3.selectAll("#stateCheckboxes input:checked").each(function() {
    selectedStates.push(this.value);
  });
  renderSlide(currentSlide);
}

// HELPER FUNCTION FOR FILTERING
function getFilteredData() {
  let data = carData;
  if (selectedMakes.length > 0) {
    data = data.filter(d => selectedMakes.includes(d.make));
  }
  if (selectedStates.length > 0) {
    data = data.filter(d => selectedStates.includes(d.state));
  }
  return data;
}

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
    .style("top", (event.pageY - 20) + "px")
    .transition().duration(200).style("opacity", 0.9);
}
function hideTooltip() {
  tooltip.transition().duration(200).style("opacity", 0);
}

// // SCENE PLACEHOLDERS
// function drawScene1() {
//   // 1. Prepare the data (filter by selectedMake if set)
//   const data = selectedMake
//     ? carData.filter(d => d.make === selectedMake)
//     : carData;

//   // 2. SVG container
//   const svg = d3.select("#vis")
//     .append("svg")
//       .attr("width", width + margin.left + margin.right)
//       .attr("height", height + margin.top + margin.bottom)
//     .append("g")
//       .attr("transform", `translate(${margin.left},${margin.top})`);

//   // 3. X scale for price
//   const x = d3.scaleLinear()
//     .domain(d3.extent(data, d => d.price))
//     .nice()
//     .range([0, width]);

//   // 4. Compute histogram bins
//   const bins = d3.bin()
//       .domain(x.domain())
//       .thresholds(30)          // 30 bins
//       (data.map(d => d.price));

//   // 5. Y scale for counts
//   const y = d3.scaleLinear()
//     .domain([0, d3.max(bins, b => b.length)])
//     .nice()
//     .range([height, 0]);

//   // 6. Draw histogram bars
//   svg.selectAll("rect")
//     .data(bins)
//     .enter().append("rect")
//       .attr("x", d => x(d.x0) + 1)
//       .attr("y", d => y(d.length))
//       .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
//       .attr("height", d => height - y(d.length))
//       .attr("fill", "#69b3a2")
//       .on("mouseover", (event, d) => {
//         showTooltip(`${d.length} cars priced \$${Math.round(d.x0)}–\$${Math.round(d.x1)}`, event);
//       })
//       .on("mouseout", hideTooltip);

//   // 7. Axes
//   svg.append("g")
//      .attr("transform", `translate(0,${height})`)
//      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("$.2s")));

//   svg.append("g")
//      .call(d3.axisLeft(y));

//   // 8. Compute avg price by year for overlay line
//   const avgByYear = Array.from(
//     d3.rollup(data,
//       v => d3.mean(v, d => d.price),
//       d => d.year
//     ),
//     ([year, avg]) => ({ year, avg })
//   ).sort((a, b) => a.year - b.year);

//   // 9. X2 scale for year (mapped onto same pixel range as price)
//   //    We’ll simply remap year extent to [0,width] for our line.
//   const x2 = d3.scaleLinear()
//     .domain(d3.extent(avgByYear, d => d.year))
//     .range([0, width]);

//   // 10. Y2 scale for avg price (reuse y)
//   //      If avg price extends beyond our histogram y-domain, you can .nice() on it instead.

//   // 11. Draw the average price line
//   const line = d3.line()
//     .x(d => x2(d.year))
//     .y(d => y(d.avg));

//   svg.append("path")
//     .datum(avgByYear)
//     .attr("fill", "none")
//     .attr("stroke", "#ff7f0e")
//     .attr("stroke-width", 2)
//     .attr("d", line)
//     .lower();  // send behind bars

//   // 12. Annotation: median drop callout
//   const median2015 = avgByYear.find(d => d.year === 2015)?.avg || 0;
//   const median2005 = avgByYear.find(d => d.year === 2005)?.avg || 0;
//   const dropPct = ((median2015 - median2005) / median2015 * 100).toFixed(0);

//   const annotations = [
//     {
//       note: {
//         title: `${dropPct}% drop`,
//         label: `Avg price fell from \$${Math.round(median2015)} in 2015 to \$${Math.round(median2005)} in 2005`
//       },
//       x: x2(2010),                      // mid‐year position
//       y: y((median2015 + median2005) / 2),
//       dx: 40,
//       dy: -30,
//       subject: { radius: 4, radiusPadding: 8 }
//     }
//   ];

//   svg.append("g")
//      .attr("class", "annotation-group")
//      .call(d3.annotation().annotations(annotations));

//   // 13. Scene title
//   svg.append("text")
//      .attr("class", "scene-title")
//      .attr("x", width / 2)
//      .attr("y", -margin.top / 2)
//      .attr("text-anchor", "middle")
//      .text(selectedMake
//        ? `Price distribution for ${selectedMake}`
//        : "Price distribution for all makes"
//      );
// }
function drawScene1() {
  // 1. Filter data using both make and state filters
  const data = getFilteredData();

  // 2. Create SVG container
  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // 3. Calculate statistics for display
  const stats = {
    totalCars: data.length,
    avgPrice: d3.mean(data, d => d.price),
    medianPrice: d3.median(data, d => d.price),
    minPrice: d3.min(data, d => d.price),
    maxPrice: d3.max(data, d => d.price),
    avgMileage: d3.mean(data, d => d.mileage),
    avgYear: d3.mean(data, d => d.year),
    uniqueMakes: new Set(data.map(d => d.make)).size,
    uniqueStates: new Set(data.map(d => d.state)).size
  };

  // 4. X‐scale for price (histogram)
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.price))
    .nice()
    .range([0, width]);

  // 5. Build bins
  const bins = d3.bin()
    .domain(x.domain())
    .thresholds(25)
    (data.map(d => d.price));

  // 6. Y‐scale for counts
  const yCount = d3.scaleLinear()
    .domain([0, d3.max(bins, b => b.length)])
    .nice()
    .range([height * 0.55, 0]); // Use only 55% of height for histogram

  // 7. Draw bars
  svg.selectAll("rect")
    .data(bins)
    .enter().append("rect")
    .attr("x", d => x(d.x0) + 1)
    .attr("y", d => yCount(d.length))
    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr("height", d => height * 0.55 - yCount(d.length))
    .attr("fill", "#69b3a2")
    .attr("opacity", 0.7)
    .on("mouseover", (event, d) => {
      const percentage = ((d.length / data.length) * 100).toFixed(1);
      showTooltip(
        `${d.length} cars (${percentage}%)<br>Price range: \$${Math.round(d.x0)}–\$${Math.round(d.x1)}`,
        event
      );
    })
    .on("mouseout", hideTooltip);

  // 8. Bottom axis (price)
  svg.append("g")
    .attr("transform", `translate(0,${height * 0.55})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d3.format("$.2s")));

  // X‐axis label
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height * 0.55 + 40)
    .attr("text-anchor", "middle")
    .text("Price (USD)");

  // 9. Left axis (count)
  svg.append("g")
    .call(d3.axisLeft(yCount));

  // Y‐axis label
  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height * 0.3)
    .attr("y", -margin.left + 15)
    .attr("text-anchor", "middle")
    .text("Number of Cars");

  // 10. Compute average price by year (if we have year data)
  const avgByYear = Array.from(
    d3.rollup(data,
      v => d3.mean(v, d => d.price),
      d => d.year
    ),
    ([year, avg]) => ({ year, avg })
  ).sort((a, b) => a.year - b.year);

  if (avgByYear.length > 1) {
    // 11. X2‐scale for year (for the line) - positioned below histogram
    const x2 = d3.scaleLinear()
      .domain(d3.extent(avgByYear, d => d.year))
      .range([0, width]);

    // 12. Y-scale for price (for the line) - positioned below histogram  
    const yPrice = d3.scaleLinear()
      .domain(d3.extent(avgByYear, d => d.avg))
      .nice()
      .range([height * 0.95, height * 0.68]); // Bottom section of chart

    // 13. Bottom section axis for year
    svg.append("g")
      .attr("transform", `translate(0,${height * 0.95})`)
      .call(d3.axisBottom(x2).tickFormat(d3.format("d")));

    // Year axis label
    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height * 0.95 + 35)
      .attr("text-anchor", "middle")
      .text("Year");

    // 14. Right axis (avg price for trend line)
    svg.append("g")
      .attr("transform", `translate(${width},0)`)
      .call(d3.axisRight(yPrice).ticks(4).tickFormat(d3.format("$.2s")));

    // Price trend axis label
    svg.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height * 0.81)
      .attr("y", width + 45)
      .attr("text-anchor", "middle")
      .text("Avg Price Trend");

    // 15. Draw the avg‐price trend line
    const line = d3.line()
      .x(d => x2(d.year))
      .y(d => yPrice(d.avg));

    svg.append("path")
      .datum(avgByYear)
      .attr("fill", "none")
      .attr("stroke", "#ff4444")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Add trend line title
    svg.append("text")
      .attr("class", "trend-title")
      .attr("x", width / 2)
      .attr("y", height * 0.65)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#ff4444")
      .text("Average Price Trend Over Years");

    // Add dots on the line
    svg.selectAll(".trend-dot")
      .data(avgByYear)
      .enter().append("circle")
      .attr("class", "trend-dot")
      .attr("cx", d => x2(d.year))
      .attr("cy", d => yPrice(d.avg))
      .attr("r", 4)
      .attr("fill", "#ff4444")
      .on("mouseover", (event, d) => {
        showTooltip(`Year: ${d.year}<br>Avg Price: \$${Math.round(d.avg)}`, event);
      })
      .on("mouseout", hideTooltip);
  }

  // 16. Statistics panel
  const statsPanel = svg.append("g")
    .attr("class", "stats-panel")
    .attr("transform", `translate(${width - 200}, 45)`);

  // Background for stats
  statsPanel.append("rect")
    .attr("width", 190)
    .attr("height", 160)
    .attr("fill", "rgba(248, 249, 250, 0.95)")
    .attr("stroke", "#dee2e6")
    .attr("stroke-width", 1)
    .attr("rx", 8)
    .style("filter", "drop-shadow(0 2px 8px rgba(0,0,0,0.1))");

  // Stats title
  statsPanel.append("text")
    .attr("x", 95)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", "14px")
    .text("Dataset Statistics");

  // Stats content
  const statsText = [
    `Total Cars: ${stats.totalCars.toLocaleString()}`,
    `Avg Price: \$${Math.round(stats.avgPrice).toLocaleString()}`,
    `Median Price: \$${Math.round(stats.medianPrice).toLocaleString()}`,
    `Price Range: \$${Math.round(stats.minPrice).toLocaleString()} - \$${Math.round(stats.maxPrice).toLocaleString()}`,
    `Avg Mileage: ${Math.round(stats.avgMileage).toLocaleString()} mi`,
    `Avg Year: ${Math.round(stats.avgYear)}`,
    `Makes: ${stats.uniqueMakes}`,
    `States: ${stats.uniqueStates}`
  ];

  statsPanel.selectAll(".stat-line")
    .data(statsText)
    .enter().append("text")
    .attr("class", "stat-line")
    .attr("x", 10)
    .attr("y", (d, i) => 35 + i * 16)
    .attr("font-size", "11px")
    .attr("fill", "#495057")
    .text(d => d);

  // 17. Scene title with filter info
  let titleText = "Car Price Distribution";
  if (selectedMakes.length > 0 || selectedStates.length > 0) {
    const filters = [];
    if (selectedMakes.length > 0) {
      filters.push(`Makes: ${selectedMakes.join(', ')}`);
    }
    if (selectedStates.length > 0) {
      filters.push(`States: ${selectedStates.join(', ')}`);
    }
    titleText += ` (${filters.join(' | ')})`;
  }

  svg.append("text")
    .attr("class", "scene-title")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .text(titleText);

  // 18. Add median and mean indicators on histogram
  svg.append("line")
    .attr("x1", x(stats.medianPrice))
    .attr("x2", x(stats.medianPrice))
    .attr("y1", 0)
    .attr("y2", height * 0.55)
    .attr("stroke", "#ff6b35")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5");

  svg.append("text")
    .attr("x", x(stats.medianPrice))
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("fill", "#ff6b35")
    .attr("font-weight", "bold")
    .text(`Median: \$${Math.round(stats.medianPrice).toLocaleString()}`);

  svg.append("line")
    .attr("x1", x(stats.avgPrice))
    .attr("x2", x(stats.avgPrice))
    .attr("y1", 0)
    .attr("y2", height * 0.55)
    .attr("stroke", "#2a9d8f")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "3,3");

  svg.append("text")
    .attr("x", x(stats.avgPrice))
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("fill", "#2a9d8f")
    .attr("font-weight", "bold")
    .text(`Mean: \$${Math.round(stats.avgPrice).toLocaleString()}`);
}

function drawScene2() {
  // 1. Filter data using both make and state filters
  const data = getFilteredData();

  // 2. Create SVG container
  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // 3. Create scales
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.mileage))
    .nice()
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.price))
    .nice()
    .range([height, 0]);

  // 4. Create color scale for states
  const states = Array.from(new Set(data.map(d => d.state)));
  const color = d3.scaleOrdinal()
    .domain(states)
    .range(d3.schemeCategory10);

  // 5. Draw axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y).tickFormat(d3.format("$.2s")));

  // 6. Axis labels
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("Mileage");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .attr("text-anchor", "middle")
    .text("Price (USD)");

  // 7. Draw the scatter plot points
  const points = svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.mileage))
    .attr("cy", d => y(d.price))
    .attr("r", 3)
    .attr("fill", d => color(d.state))
    .attr("opacity", 0.7)
    .on("mouseover", (e, d) => showTooltip(
      `${d.make} ${d.model}<br>\$${d.price}<br>${d.mileage} mi<br>State: ${d.state}`, e))
    .on("mouseout", hideTooltip);

  // 8. Add a brush for selection
  const brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on("end", brushed);

  svg.append("g")
    .attr("class", "brush")
    .call(brush);

  // 9. Container for listing selected cars
  d3.select("#vis")
    .append("div")
    .attr("id", "selectionList")
    .style("max-height", "200px")
    .style("overflow", "auto")
    .style("margin-top", "10px")
    .style("border", "1px solid #ddd")
    .style("padding", "10px");

  // 10. Scene title with filter info
  let titleText = "Price vs Mileage - Select cars with brush";
  if (selectedMakes.length > 0 || selectedStates.length > 0) {
    const filters = [];
    if (selectedMakes.length > 0) {
      filters.push(`Makes: ${selectedMakes.join(', ')}`);
    }
    if (selectedStates.length > 0) {
      filters.push(`States: ${selectedStates.join(', ')}`);
    }
    titleText += ` (${filters.join(' | ')})`;
  }

  svg.append("text")
    .attr("class", "scene-title")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .text(titleText);

  // 11. Add legend for states (if multiple states visible)
  if (states.length > 1 && states.length <= 10) {
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 100}, 20)`);

    const legendItems = legend.selectAll(".legend-item")
      .data(states)
      .enter().append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 15})`);

    legendItems.append("circle")
      .attr("r", 4)
      .attr("fill", d => color(d));

    legendItems.append("text")
      .attr("x", 10)
      .attr("y", 4)
      .attr("font-size", "10px")
      .text(d => d);
  }

  // 12. Brush handler
  function brushed({ selection }) {
    if (!selection) {
      // clear if user clears brush
      points.attr("fill", d => color(d.state)).attr("opacity", 0.7);
      return d3.select("#selectionList").html("<p>No cars selected. Use the brush to select cars.</p>");
    }
    const [[x0, y0], [x1, y1]] = selection;
    // find selected points
    const selected = data.filter(d =>
      x(d.mileage) >= x0 && x(d.mileage) <= x1 &&
      y(d.price) >= y0 && y(d.price) <= y1
    );
    // highlight in scatter
    points.attr("fill", d =>
      selected.includes(d) ? color(d.state) : "#ddd"
    ).attr("opacity", d =>
      selected.includes(d) ? 1.0 : 0.2
    );
    // list them below
    const listContainer = d3.select("#selectionList").html("");
    if (selected.length === 0) {
      listContainer.html("<p>No cars in selected area.</p>");
    } else {
      listContainer.append("h4").text(`Selected Cars (${selected.length})`);
      const list = listContainer
        .selectAll("p")
        .data(selected, d => `${d.make}-${d.model}-${d.mileage}`);
      list.enter().append("p")
        .html(d => `<strong>${d.make} ${d.model}</strong> — \$${d.price} — ${d.state} — ${d.mileage} mi — Year: ${d.year}`)
        .style("color", d => color(d.state))
        .style("margin", "2px 0");
    }
  }
}
function drawScene3() {
  // 1. Filter data using both make and state filters
  const data = getFilteredData();

  // 2. Create SVG container
  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // 3. Aggregate data by make
  const makeData = Array.from(
    d3.rollup(data, v => ({
      count: v.length,
      avgPrice: d3.mean(v, d => d.price),
      avgMileage: d3.mean(v, d => d.mileage)
    }), d => d.make),
    ([make, values]) => ({ make, ...values })
  ).sort((a, b) => b.count - a.count).slice(0, 10); // Top 10 makes

  // 4. Create scales
  const x = d3.scaleBand()
    .domain(makeData.map(d => d.make))
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(makeData, d => d.count)])
    .nice()
    .range([height, 0]);

  // 5. Draw bars
  svg.selectAll("rect")
    .data(makeData)
    .join("rect")
    .attr("x", d => x(d.make))
    .attr("y", d => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.count))
    .attr("fill", "#69b3a2")
    .attr("opacity", 0.8)
    .on("mouseover", (event, d) => {
      showTooltip(
        `${d.make}<br>${d.count} cars<br>Avg Price: \$${Math.round(d.avgPrice)}<br>Avg Mileage: ${Math.round(d.avgMileage)}`,
        event
      );
    })
    .on("mouseout", hideTooltip)
    .on("click", (event, d) => {
      // Toggle filter by make
      const makeIndex = selectedMakes.indexOf(d.make);
      if (makeIndex > -1) {
        selectedMakes.splice(makeIndex, 1); // Remove if already selected
      } else {
        selectedMakes.push(d.make); // Add if not selected
      }
      
      // Update the checkboxes
      d3.selectAll("#makeCheckboxes input").property("checked", function() {
        return selectedMakes.includes(this.value);
      });
      
      renderSlide(currentSlide); // Re-render current slide with filter
    });

  // 6. Draw axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg.append("g")
    .call(d3.axisLeft(y));

  // 7. Axis labels
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 5)
    .attr("text-anchor", "middle")
    .text("Car Make");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .attr("text-anchor", "middle")
    .text("Number of Cars");

  // 8. Scene title with filter info
  let titleText = "Car count by make - Click bars to toggle filter";
  if (selectedMakes.length > 0 || selectedStates.length > 0) {
    const filters = [];
    if (selectedMakes.length > 0) {
      filters.push(`Makes: ${selectedMakes.join(', ')}`);
    }
    if (selectedStates.length > 0) {
      filters.push(`States: ${selectedStates.join(', ')}`);
    }
    titleText = `Car count by make (${filters.join(' | ')})`;
  }

  svg.append("text")
    .attr("class", "scene-title")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .text(titleText);

  // 9. Add filter status
  if (selectedMakes.length > 0 || selectedStates.length > 0) {
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("fill", "#666")
      .style("font-size", "12px")
      .text("Click bars to toggle make filter, use multi-select dropdowns for other filters");
  }
}

