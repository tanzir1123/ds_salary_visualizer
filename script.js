// Configurable Variables
const width = 2000;
const height = 1200;
const geoJsonUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
const csvUrl = "jobs_in_data_with_iso_updated.csv";
const countryCodeColumn = "ISO";
const salaryColumn = "salary_in_usd";

// Create an SVG element to hold the map
const svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

// Add title
svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .text("What is the typical salary of a Data Scientist?");

// Define a projection and path generator
const projection = d3.geoNaturalEarth1()
    .scale(300)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Load the data
Promise.all([
    d3.json(geoJsonUrl),
    d3.csv(csvUrl)
]).then(([geojson, salaryData]) => {
    // Compute the average salary for each country
    const salaryMap = new Map();
    const countryCount = new Map();

    salaryData.forEach(d => {
        const country = d[countryCodeColumn];
        const salary = +d[salaryColumn];

        if (!salaryMap.has(country)) {
            salaryMap.set(country, 0);
            countryCount.set(country, 0);
        }

        salaryMap.set(country, salaryMap.get(country) + salary);
        countryCount.set(country, countryCount.get(country) + 1);
    });

    let minSalary = Infinity;
    let maxSalary = -Infinity;

    salaryMap.forEach((total, country) => {
        const avgSalary = total / countryCount.get(country);
        salaryMap.set(country, avgSalary);
        if (avgSalary < minSalary) minSalary = avgSalary;
        if (avgSalary > maxSalary) maxSalary = avgSalary;
    });

    // Custom Blue Interpolator
    const blueInterpolator = d3.interpolateRgb("lightblue", "darkblue");

    // Set up a diverging color scale using the custom interpolator
    const color = d3.scaleDiverging(blueInterpolator)
        .domain([minSalary, (minSalary + maxSalary) / 2, maxSalary]);

    // Bind the GeoJSON data to SVG paths
    svg.append("g")
        .selectAll("path")
        .data(geojson.features.filter(d => d.properties.name !== "Antarctica")) // Remove Antarctica
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", d => {
            const salary = salaryMap.get(d.id);
            return salary ? color(salary) : '#ccc'; // Grey color for countries with no data
        });

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    svg.selectAll(".country")
        .on("mouseover", function(event, d) {
            const salary = salaryMap.get(d.id);
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(d.properties.name + "<br/>" + "Avg Salary: " + (salary ? `$${salary.toFixed(0)}` : "No data"))
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Add color legend
    const legendWidth = 300;
    const legendHeight = 20;
    const legendPadding = 10;
    const legendMargin = {top: 20, right: 20, bottom: 0, left: 0};

    const legendSvg = svg.append("g")
        .attr("transform", `translate(${width - legendWidth - legendMargin.right}, ${legendMargin.top})`);

    const legendScale = d3.scaleLinear()
        .domain([minSalary, maxSalary])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d3.format(".2s"));

    legendSvg.append("g")
        .selectAll("rect")
        .data(d3.range(minSalary, maxSalary, (maxSalary - minSalary) / legendWidth))
        .enter().append("rect")
        .attr("x", d => legendScale(d))
        .attr("y", 0)
        .attr("width", legendWidth / legendWidth)
        .attr("height", legendHeight)
        .attr("fill", d => color(d));

    legendSvg.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis);
});
