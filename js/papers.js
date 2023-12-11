class PapersVis{

    constructor(_parentElement, _papersdata){
        this.parentElement = _parentElement;
        this.data = _papersdata;
        this.displayData = [];
        this.selectedKeywords = 'Default';


        // call method initVis
        this.initVis();
        this.setupSelectionListener(); // Make sure this is called
    }

    initVis(){
        let vis = this;

        // define margins
        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select(`#${vis.parentElement}`)
            .append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .append("g")
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        //Tooltip
        this.tooltipHover = d3.select("body").append("div")
            .attr("class", "tooltip hover-tooltip")
            .style("opacity", 0);

        /*        this.tooltipClick = d3.select("body").append("div")
                    .attr("class", "tooltip click-tooltip")
                    .style("opacity", 0);*/
        // Create x-axis group
        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${vis.height - vis.margin.bottom})`);

        // Create x-axis
        vis.xAxis = d3.axisBottom()
            .scale(d3.scaleLinear())  // Initially, set a placeholder scale
            .tickFormat(d3.format("d"));

        // Append x-axis to the svg
        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${vis.height - vis.margin.bottom})`);


        vis.wrangleData();
    }
    setupSelectionListener() {
        const selectionBox = document.getElementById('paperSelection');

        selectionBox.addEventListener('change', function(event) {
            let selectedValue = event.target.value;
            this.selectedKeywords = selectedValue;
            console.log('Selected option:', this.selectedKeywords);
            this.filterBySelection(selectedValue);
        }.bind(this)); // Bind 'this' to refer to the PapersVis instance
    }

    filterBySelection(selectedValue) {
        let vis = this;

        // Filter the data based on the selected value
        if (selectedValue === 'Default') {
            vis.displayData = vis.data; // Show all data if 'Default' is selected
        } else {
            vis.displayData = vis.data.filter(d =>
                d.Keywords.split(", ").includes(selectedValue)
            );
        }

        // Call updateVis to redraw the visualization with the filtered data
        vis.updateVis();
    }

    wrangleData(){
        let vis = this;

        vis.displayData = vis.data;

        console.log('here is papers data', vis.displayData);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        //Selected Keywords
        const selectedKeyword = vis.selectedKeywords

        // Define the keywords and corresponding colors
        const keywords = {
            "Music": "#df473c",
            "Personality": "#255e79",
            "Social": "#f3c33c",
            "Technology": "#267778",
            "Psychology": "#ae3c60",
            "Sciences": "#82b4bb",
        };

        // Sort the data by publish year
        vis.displayData.sort((a, b) => a["Publish Year"] - b["Publish Year"]);

        let buffer = 50;


        // Remove the existing x-axis
        vis.svg.selectAll(".x-axis").remove();

        // Set up scales
        // X scale for years
        const xScale = d3.scaleLinear()
            .domain(d3.extent(vis.displayData, d => d["Publish Year"]))
            .range([buffer, vis.width - buffer]);

        // Y scale - static or based on another variable if needed
        const yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // Radius scale for author number
        const fullExtentAuthorNumber = d3.extent(vis.data, d => d["Author number"]);
        const radiusScale = d3.scaleSqrt()
            .domain(fullExtentAuthorNumber)
            .range([1, 15]);

        // Initialize the yearOffsets map
        let yearOffsets = {};

        // Calculate and store Y positions for each paper
        vis.displayData.forEach(paper => {
            if (!yearOffsets[paper["Publish Year"]]) {
                yearOffsets[paper["Publish Year"]] = 0;
            }

            const baseYPosition = vis.height / 6;
            paper.yPosition = baseYPosition + yearOffsets[paper["Publish Year"]];

            // Calculate the increment for the next paper in the same year
            yearOffsets[paper["Publish Year"]] += paper.Keywords.split(", ").length * radiusScale(paper["Author number"]) + 50;
        });

        /*        // First, handle the exit for existing paper groups
                vis.svg.selectAll(".paper-group").data(vis.displayData, d => d.Identifier).exit().remove();*/

        // Bind the new data to the paper groups
        let paperGroups = vis.svg.selectAll(".paper-group")
            .data(vis.displayData, d => d.Identifier);

        // Exit selection for paper groups and their child circles
        paperGroups.exit().each(function() {
            d3.select(this).selectAll('circle')
                .transition()
                .duration(500)
                .style("opacity", 0)
                .remove();
        }).transition()
            .duration(500)
            .style("opacity", 0)
            .remove();

        // Enter selection for new paper groups
        let paperGroupsEnter = paperGroups.enter()
            .append("g")
            .attr("class", "paper-group")
            .attr("transform", d => `translate(${xScale(d["Publish Year"])}, ${d.yPosition})`)
            .style("opacity", 0);

        paperGroupsEnter.transition()
            .duration(500)
            .style("opacity", 1);

        // Update selection for existing paper groups
        paperGroups.transition()
            .duration(500)
            .attr("transform", d => `translate(${xScale(d["Publish Year"])}, ${d.yPosition})`)
            .style("opacity", 1);

        // Handle circles inside each paper group
        paperGroupsEnter.merge(paperGroups).each(function(paper) {
            let group = d3.select(this);
            let circles = group.selectAll('circle')
                .data(paper.Keywords.split(", ").map(k => k.trim()));

            // Exit selection for circles
            circles.exit()
                .transition()
                .duration(500)
                .style("opacity", 0)
                .remove();

            // Enter + Update selection for circles
            circles.enter()
                .append("circle")
                .merge(circles)
                .transition()
                .duration(500)
                .attr("r", (keyword, index) => {
                    let radius = 5 + index * 5;
                    return Math.max(radius, 0);
                })
                .style("fill", (keyword, index) => index === 0 ? keywords[keyword] : "none")
                .style("stroke", keyword => keywords[keyword])
                .style("stroke-width", '5px')
                .style("opacity", keyword => {
                    if (selectedKeyword === 'Default') {
                        return 0.8; // If 'Default' is selected, all keywords have an opacity of 0.8
                    } else {
                        return keyword === selectedKeyword ? 1 : 0.2; // If a specific keyword is selected, it gets full opacity (1), others get 0.3
                    }
                });
        });

        // Handle exit for the groups
        paperGroups.exit()
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();

        let axis_buffer = 300;

        // Define the rectangle box for click content
        vis.infoBox = vis.svg.append("rect")
            .attr("class", "info-box")
            .attr("x", buffer)
            .attr("y", vis.height - axis_buffer + 40)
            .attr("width",vis.width - buffer * 2)
            .attr("height", vis.height - (vis.height - axis_buffer + 40) - 20)
            .style("fill", "#fff4d6")
            .style("stroke", "#393A4C")
            .style("opacity", 1);

        // Define default text for the info box
        const defaultTitleText = "INTRODUCTION";
        const defaultContentText = "Each circle, with its central point and surrounding rings, represents an individual academic paper.";
        const defaultContentText2 = "The color of each ring corresponds to a keyword associated with the paper. 👉 Click on a circle to view more details about the paper.";
        const introduction_buffer = 65;
        const introduction_content_buffer = 45;

        vis.infoTextTitle = vis.svg.append("text")
            .attr("class", "info-text-title")
            .attr("x", buffer + 20) // Slightly inside the rectangle
            .attr("y", vis.height - axis_buffer + introduction_buffer) // Position for the title
            .text(defaultTitleText)
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "black");

        // Content text element
        vis.infoTextContent = vis.svg.append("text")
            .attr("x", buffer + 100)
            .attr("y", vis.height - axis_buffer + introduction_buffer + introduction_content_buffer) // Starting position for the content
            .text(defaultContentText)
            .attr("class", "info-text-content")
            .style("font-size", "15px") // Smaller font for content
            .style("fill", "black");

        vis.infoTextContent2 = vis.svg.append("text")
            .attr("x", buffer + 100)
            .attr("y", vis.height - axis_buffer + introduction_buffer + introduction_content_buffer + 20) // Starting position for the content
            .text(defaultContentText2)
            .attr("class", "info-text-content2")
            .style("font-size", "15px") // Smaller font for content
            .style("fill", "black");

        // Define the base radius for the innermost circle
        const baseRadius = 10;
        const strokeWidth = 5;
        const infoCirclex = buffer + 50;
        const infoCircley = vis.height - axis_buffer + introduction_buffer + 50;

        // Draw the innermost circle for "Music"
        vis.svg.append("circle")
            .attr("class", "info-circle")
            .attr("cx", infoCirclex)
            .attr("cy", infoCircley)
            .attr("r", baseRadius)
            .style("fill", keywords["Music"]);

        // Draw the rings for the remaining keywords
        const keywordOrder = ["Personality","Social", "Technology", "Psychology", "Sciences"];
        keywordOrder.forEach((keyword, index) => {
            vis.svg.append("circle")
                .attr("class", "info-circle")
                .attr("cx", infoCirclex)
                .attr("cy", infoCircley)
                .attr("r", baseRadius + strokeWidth * index)
                .style("fill", "none")
                .style("stroke", keywords[keyword])
                .style("stroke-width", `${strokeWidth}px`);
        });


        // Tooltip event handlers
        vis.svg.selectAll('.paper-group')
            .on("click", function(event, d) {

                // Clear existing text
                // Clear existing text for both title and content
                vis.svg.selectAll(".info-text-title, .info-text-content,.info-text-content2, .info-circle").remove();

                let fullTitle = `Title: ${d["Title"]}`;
                let wrappedTitle = wrapText(fullTitle, 150); // Adjust the character limit as needed

                let titleY = vis.height - axis_buffer + 65;
                wrappedTitle.forEach(function(line, index) {
                    vis.svg.append("text")
                        .attr("class", "info-text-title")
                        .attr("x", buffer + 20)
                        .attr("y", titleY + index * 25)
                        .text(line)
                });

                let contentY = titleY + wrappedTitle.length * 25;


                // Authors
                vis.svg.append("text")
                    .attr("class", "info-text-content")
                    .attr("x", buffer + 20)
                    .attr("y", contentY)
                    .text(`Authors: ${d["Author"]}`);

                contentY += 25; // Adjust y position for next line

                // Year
                vis.svg.append("text")
                    .attr("class", "info-text-content")
                    .attr("x", buffer + 20)
                    .attr("y", contentY)
                    .text(`Year: ${d["Publish Year"]}`);

                contentY += 25; // Adjust y position for next line

                // Keywords
                vis.svg.append("text")
                    .attr("class", "info-text-content")
                    .attr("x", buffer + 20)
                    .attr("y", contentY)
                    .text(`Keywords: ${d["Keywords"]}`);

                //Is Part of
                vis.svg.append("text")
                    .attr("class", "info-text-content")
                    .attr("x", buffer + 20)
                    .attr("y", contentY + 25)
                    .text(`Is Part Of: ${d["Is Part Of"]}`);

                //Identifier
                vis.svg.append("text")
                    .attr("class", "info-text-content")
                    .attr("x", buffer + 20)
                    .attr("y", contentY + 50)
                    .text(`Identifier: ${d["Identifier"]}`);
            });

        // Calculate the range of years from the data
        const yearRange = d3.extent(vis.displayData, d => d["Publish Year"]);
        const years = d3.range(yearRange[0], yearRange[1] + 1);

        // Create and append the x-axis to the SVG
        const xAxis = d3.axisBottom(xScale)
            .tickValues(years)
            .tickFormat(d3.format("d"));

        const xAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${vis.height - axis_buffer})`)
            .call(xAxis);

        // Rotate text elements for the x-axis
        vis.svg.selectAll(".x-axis text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Retrieve tick values from the x-axis
        const tickValues = xAxisGroup.selectAll(".tick").data().map(d => d.value);
        console.log('Tick values for gridlines:', tickValues);

        // Bind the tick values to the gridlines and create/update/remove them
        vis.svg.selectAll(".gridline")
            .data(years)
            .join(
                enter => enter.append("line")
                    .attr("class", "gridline")
                    .attr("y1", 80)
                    .attr("y2", vis.height - axis_buffer)
                    .style("stroke", "lightgrey")
                    .style("stroke-width", 1)
                    .style("stroke-dasharray", "2,2")
                    .style("shape-rendering", "crispEdges")
                    .attr("x1", d => xScale(d))
                    .attr("x2", d => xScale(d)),
                update => update
                    .transition()
                    .duration(500)
                    .attr("x1", d => xScale(d))
                    .attr("x2", d => xScale(d)),
                exit => exit
                    .transition()
                    .duration(500)
                    .style("opacity", 0)
                    .remove()
            );


        //Legend
        // Check if the color legend group already exists
        if (vis.svg.select(".color-legend").empty()) {
            // Create a group for the color legend if it doesn't exist
            vis.svg.append("g")
                .attr("class", "color-legend")
                .attr("transform", "translate(20,20)"); // Adjust as needed
        }
        // Clear existing color legend items
        vis.svg.selectAll(".color-legend-item").remove();
        //clear existing color text
        vis.svg.selectAll(".text").remove();

        // Create a group for the color legend
        const colorLegendGroup = vis.svg.append("g")
            .attr("class", "color-legend")
            .attr("transform", "translate(20,20)");

        const legendItemWidth = 100;

        Object.keys(keywords).forEach((keyword, index) => {
            const legendItem = vis.svg.select(".color-legend").append("g")
                .attr("class", "color-legend-item")
                .attr("transform", `translate(${index * legendItemWidth + vis.width/5}, 0)`);

            legendItem.append("circle")
                .attr("cy", 5)
                .attr("r", 10)
                .style("fill", keywords[keyword]);

            legendItem.append("text")
                .attr("x", 15)
                .attr("y", 10)
                .text(keyword)
                .style("font-size", "12px");
        });


        function wrapText(text, maxWidth) {
            let words = text.split(/\s+/);
            let newLine = '';
            let lines = [];
            for (let i = 0; i < words.length; i++) {
                let testLine = newLine + words[i] + ' ';
                if (testLine.length > maxWidth && i > 0) {
                    lines.push(newLine);
                    newLine = words[i] + ' ';
                } else {
                    newLine = testLine;
                }
            }
            lines.push(newLine);
            return lines;
        }

    }

}