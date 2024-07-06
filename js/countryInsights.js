// Function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Get the country code from the URL
const country = getUrlParameter('country');

// Set the country title
document.getElementById('country-title').innerText = `Country Insights: ${country}`;

// Load the data and create visualizations
d3.csv("data/jobs_in_data_with_iso_updated.csv").then(data => {
    const countryData = data.filter(d => d.ISO === country);

    // Visualization 1: Top 5 average salary by Job Title
    createBarChart(countryData, 'salary_in_usd', 'job_title', '#bar-chart-1', 5);

    // Visualization 2: Company Size Avg Salary
    createGroupedBarChart(countryData, 'company_size', 'salary_in_usd', '#bar-chart-2');

    // Visualization 3: Experience Level Avg Salary
    createGroupedBarChart(countryData, 'experience_level', 'salary_in_usd', '#bar-chart-3');

    // Visualization 4: Box Plot for Experience Level
    createBoxPlot(countryData, 'experience_level', 'salary_in_usd', '#box-plot');

    // Visualization 5: Line Chart for Work Year
    createLineChart(countryData, 'work_year', 'salary_in_usd', '#line-chart');
});

// Helper functions for creating charts

function createBarChart(data, valueField, categoryField, selector, topN) {
    const avgSalaryByCategory = Array.from(d3.group(data, d => d[categoryField]), ([key, value]) => ({
        key,
        value: d3.mean(value, d => +d[valueField])
    }));

    const sortedData = avgSalaryByCategory.sort((a, b) => b.value - a.value).slice(0, topN);

    const margin = { top: 20, right: 20, bottom: 60, left: 200 }; // Increased bottom and left margins for axis labels
    const width = document.querySelector(selector).clientWidth - margin.left - margin.right;
    const height = document.querySelector(selector).clientHeight - margin.top - margin.bottom;

    const svg = d3.select(selector).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleBand().range([height, 0]).padding(0.1);

    x.domain([0, d3.max(sortedData, d => +d.value)]);
    y.domain(sortedData.map(d => d.key));

    svg.selectAll(".bar")
        .data(sortedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("width", 0) // Start with zero width for animation
        .attr("y", d => y(d.key))
        .attr("height", y.bandwidth())
        .attr("fill", "purple") // Set bar color to purple
        .transition()
        .duration(1000) // Duration of transition in milliseconds
        .attr("width", d => x(d.value));

    // Add labels
    svg.selectAll(".label")
        .data(sortedData)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", 0) // Start with zero position for animation
        .attr("y", d => y(d.key) + y.bandwidth() / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(d => `$${d.value.toFixed(0)}`) // Initial text before transition
        .transition()
        .duration(1000) // Duration of transition in milliseconds
        .attr("x", d => x(d.value) - 3); // Final position after transition

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".2s")));

    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y));

    // Add X axis label
    svg.append("text")
        .attr("class", "x axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10) // Position below the X axis
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Average Salary in USD");

    // Add Y axis label
    svg.append("text")
        .attr("class", "y axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20) // Position to the left of the Y axis
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Job Title");
}




// Repeat the margin adjustment for other chart functions

function createGroupedBarChart(data, groupField, valueField, selector) {
    const groupedData = Array.from(d3.group(data, d => d[groupField]), ([key, value]) => ({
        key,
        value: d3.mean(value, d => +d[valueField])
    }));

    const margin = { top: 20, right: 20, bottom: 60, left: 150 }; // Increased bottom and left margins for axis labels
    const width = document.querySelector(selector).clientWidth - margin.left - margin.right;
    const height = document.querySelector(selector).clientHeight - margin.top - margin.bottom;

    const svg = d3.select(selector).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().range([0, width]).padding(0.1);
    const y = d3.scaleLinear().range([height, 0]);

    x.domain(groupedData.map(d => d.key));
    y.domain([0, d3.max(groupedData, d => d.value)]);

    svg.selectAll(".bar")
        .data(groupedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.key))
        .attr("width", x.bandwidth())
        .attr("y", height) // Start bars from the bottom of the chart
        .attr("height", 0) // Start bars with zero height for animation
        .attr("fill", "#1BE2E8") // Set bar color to #1BE2E8
        .transition()
        .duration(1000) // Duration of transition in milliseconds
        .attr("y", d => y(d.value))
        .attr("height", d => height - y(d.value));

    // Add labels
    svg.selectAll(".label")
        .data(groupedData)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => x(d.key) + x.bandwidth() / 2)
        .attr("y", height) // Start labels from the bottom of the chart
        .attr("text-anchor", "middle")
        .text(d => `$${d.value.toFixed(0)}`) // Initial text before transition
        .transition()
        .duration(1000) // Duration of transition in milliseconds
        .attr("y", d => y(d.value) - 5);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")));

    // Determine X axis label based on groupField
    let xAxisLabel;
    if (groupField === 'company_size') {
        xAxisLabel = 'Company Size';
    } else if (groupField === 'experience_level') {
        xAxisLabel = 'Experience Level';
    } else {
        xAxisLabel = groupField; // Default to the groupField name if not matched
    }

    // Add X axis label
    svg.append("text")
        .attr("class", "x axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10) // Position below the X axis
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text(xAxisLabel);

    // Add Y axis label
    svg.append("text")
        .attr("class", "y axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20) // Position to the left of the Y axis
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Average Salary in USD");
}



function createBoxPlot(data, groupField, valueField, selector) {
    const boxPlotData = Array.from(d3.group(data, d => d[groupField]), ([key, value]) => {
        const sortedValues = value.map(d => +d[valueField]).sort(d3.ascending);
        const q1 = d3.quantile(sortedValues, 0.25);
        const median = d3.quantile(sortedValues, 0.5);
        const q3 = d3.quantile(sortedValues, 0.75);
        const min = sortedValues[0];
        const max = sortedValues[sortedValues.length - 1];
        return { key, q1, median, q3, min, max };
    });

    const margin = { top: 20, right: 20, bottom: 30, left: 100 };
    const width = document.querySelector(selector).clientWidth - margin.left - margin.right;
    const height = document.querySelector(selector).clientHeight - margin.top - margin.bottom;

    const svg = d3.select(selector).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().range([0, width]).padding(0.1);
    const y = d3.scaleLinear().range([height, 0]);

    x.domain(boxPlotData.map(d => d.key));
    y.domain([0, d3.max(boxPlotData, d => d.max)]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")));

    const boxWidth = x.bandwidth() * 0.5;

    svg.selectAll(".box")
        .data(boxPlotData)
        .enter().append("rect")
        .attr("class", "box")
        .attr("x", d => x(d.key) - boxWidth / 2)
        .attr("width", boxWidth)
        .attr("y", d => y(d.q3))
        .attr("height", d => y(d.q1) - y(d.q3));

    svg.selectAll(".median")
        .data(boxPlotData)
        .enter().append("line")
        .attr("class", "median")
        .attr("x1", d => x(d.key) - boxWidth / 2)
        .attr("x2", d => x(d.key) + boxWidth / 2)
        .attr("y1", d => y(d.median))
        .attr("y2", d => y(d.median));

    svg.selectAll(".min")
        .data(boxPlotData)
        .enter().append("line")
        .attr("class", "min")
        .attr("x1", d => x(d.key) - boxWidth / 2)
        .attr("x2", d => x(d.key) + boxWidth / 2)
        .attr("y1", d => y(d.min))
        .attr("y2", d => y(d.min));

    svg.selectAll(".max")
        .data(boxPlotData)
        .enter().append("line")
        .attr("class", "max")
        .attr("x1", d => x(d.key) - boxWidth / 2)
        .attr("x2", d => x(d.key) + boxWidth / 2)
        .attr("y1", d => y(d.max))
        .attr("y2", d => y(d.max));
}

function createLineChart(data, xField, yField, selector) {
    const groupedData = Array.from(d3.group(data, d => d.work_setting), ([workSetting, values]) => ({
        workSetting,
        values: Array.from(d3.group(values, d => d[xField]), ([key, value]) => ({
            key: new Date(key, 0, 1), // Convert year to Date object
            value: d3.mean(value, d => +d[yField])
        })).sort((a, b) => a.key - b.key) // Sort values by xField
    }));

    const margin = { top: 20, right: 20, bottom: 60, left: 100 };
    const width = document.querySelector(selector).clientWidth - margin.left - margin.right;
    const height = document.querySelector(selector).clientHeight - margin.top - margin.bottom;

    const svg = d3.select(selector).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime().range([0, width]); // Use time scale for x-axis
    const y = d3.scaleLinear().range([height, 0]);

    x.domain([
        d3.min(groupedData, group => d3.min(group.values, d => d.key)),
        d3.max(groupedData, group => d3.max(group.values, d => d.key))
    ]);
    y.domain([
        0, 
        d3.max(groupedData, group => d3.max(group.values, d => d.value))
    ]);

    const line = d3.line()
        .x(d => x(d.key))
        .y(d => y(d.value));

    const color = d3.scaleOrdinal(d3.schemeCategory10); // Color scheme for different work settings

    svg.selectAll(".line")
        .data(groupedData)
        .enter().append("path")
        .attr("class", "line")
        .attr("d", d => line(d.values))
        .attr("fill", "none")
        .attr("stroke", d => color(d.workSetting))
        .attr("stroke-width", 2)
        .attr("id", d => `line-${d.workSetting}`); // Add ID for each line

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y"))); // Format the ticks to display years

    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")));

    // Add X axis label
    svg.append("text")
        .attr("class", "x axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10) // Position below the X axis
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Year");

    // Add Y axis label
    svg.append("text")
        .attr("class", "y axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20) // Position to the left of the Y axis
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Average Salary in USD");

    // Add legend
    const legend = svg.selectAll(".legend")
        .data(groupedData)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", d => color(d.workSetting));

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(d => d.workSetting);
}
