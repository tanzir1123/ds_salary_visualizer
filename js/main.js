// Configurable Variables
const width = 960;
const height = 500;
const geoJsonUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
const csvUrl = "data/jobs_in_data_with_iso_updated.csv";
const countryCodeColumn = "ISO";
const salaryColumn = "salary_in_usd";

// Create an SVG element to hold the map
const svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

// Define a projection and path generator
const projection = d3.geoNaturalEarth1()
    .scale(160)
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
            tooltip.html(d.properties.name + "<br/>" + (salary ? `$${salary.toFixed(2)}` : "No data"))
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", function(event, d) {
            window.location.href = `country_insights.html?country=${d.id}`;
        });

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .text("Average Salary of Data Scientists by Country");
});
