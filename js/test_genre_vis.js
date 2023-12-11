
class TestGenreVis {
    constructor(_parentElement, _genreMbtiData, _mbtiGenreData, _selectedMbti) {
        this.parentElement = _parentElement;
        this.genreMbtiData = _genreMbtiData;
        this.mbtiGenreData = _mbtiGenreData;
        this.selectedMbti = _selectedMbti;

        this.initVis();
    }

    initVis() {
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

        vis.svg.append("text")
            .attr("id", "test-genre-vis-header")
            .text(`As ${vis.selectedMbti[0]}, you might`)
            .attr("x", vis.width/2)
            .attr("y", vis.height * 0.05)
            .style("text-anchor", "middle");
        vis.svg.append("text")
            .attr("id", "test-genre-vis-label-positive")
            .text("Like:")
            .attr("x", vis.width/4)
            .attr("y", vis.height * 0.15)
            .style("text-anchor", "middle");
        vis.svg.append("text")
            .attr("id", "test-genre-vis-label-negative")
            .text("Dislike:")
            .attr("x", vis.width/4*3)
            .attr("y", vis.height * 0.15)
            .style("text-anchor", "middle");

        // add center line
        vis.svg.append("line")
            .attr("x1", vis.width / 2)
            .attr("y1", 75)
            .attr("x2", vis.width/2)
            .attr("y2", vis.height - 75)
            .style("stroke-dasharray", "5,5")
            .style("stroke", "black");

        // initialize scales
        vis.r = d3.scaleSqrt()
            .range([20, vis.width/14]);
        vis.colorPositive = d3.scaleSequential()
            .range(["#FFFFFF", "#6C6CA5"]);
        vis.colorNegative = d3.scaleSequential()
            .range(["#FFFFFF", "#6e6b62"]);

        // initialize simulation
        vis.centers = {
            positive: {x: vis.width*0.2, y: vis.height*0.6},
            neutral: {x: vis.width*0.5, y: vis.height*0.3},
            negative: {x: vis.width*0.8, y: vis.height*0.6}
        };

        vis.simulation = d3.forceSimulation()
            .force('charge', d3.forceManyBody().strength(vis.charge))
            //.force("center", d3.forceCenter(nodeCenterX, vis.height / 2))
            .force('x', d3.forceX().strength(0.03).x(nodeCenterX))
            .force('y', d3.forceY().strength(0.03).y(nodeCenterY))
            .force('collision', d3.forceCollide().radius(d => d.radius + 1));

        function nodeCenterX(d) {
            if (d.rating_relative > 0.1) { return vis.centers['positive'].x; }
            else if (d.rating_relative < -0.1) { return vis.centers['negative'].x; }
            else { return vis.centers['neutral'].x; }
        }

        function nodeCenterY(d) {
            if (d.rating_relative > 0.1) { return vis.centers['positive'].y; }
            else if (d.rating_relative < -0.1) { return vis.centers['negative'].y; }
            else { return vis.centers['neutral'].y; }
        }

        vis.simulation.stop();

        vis.baseline = 'same_mbti';

        vis.baselineButton = vis.svg.append("g")
            .attr("class", "button switch-baseline-button")
            .attr("id", "switch-button-genre");

        vis.baselineButton.append("rect")
            .attr("x", vis.width / 2 - 70)
            .attr("y", vis.height - 50)
            .attr("width", 140)
            .attr("height", 30)
            .attr("fill", "#FFFFFF")
            .style("stroke", "black")
            .style("stroke-width", "2px");

        vis.baselineButton.append("text")
            .attr("x", vis.width / 2)
            .attr("y", vis.height - 30)
            .attr("text-anchor", "middle")
            .text("Switch Baseline");

        vis.baselineButton.on("click", function(event) { vis.switchBaseline(event, vis); } );

        vis.shuffleButton = vis.svg.append("g")
            .attr("class", "button shuffle-button")
            .attr("id", "shuffle-button-genre");

        vis.shuffleButton.append("rect")
            .attr("x", vis.width / 2 - 220)
            .attr("y", vis.height - 50)
            .attr("width", 100)
            .attr("height", 30)
            .attr("fill", "#FFFFFF")
            .style("stroke", "black")
            .style("stroke-width", "2px");

        vis.shuffleButton.append("text")
            .attr("x", vis.width / 2 - 170)
            .attr("y", vis.height - 30)
            .attr("text-anchor", "middle")
            .text("Shuffle");

        vis.shuffleButton.on("click", function(event) { vis.wrangleData(); } );

        vis.proceedButton = vis.svg.append("g")
            .attr("class", "button proceed-button")
            .attr("id", "proceed-button-genre");

        vis.proceedButton.append("rect")
            .attr("x", vis.width / 2 + 120)
            .attr("y", vis.height - 50)
            .attr("width", 100)
            .attr("height", 30)
            .attr("fill", "#FFFFFF")
            .style("stroke", "black")
            .style("stroke-width", "2px");

        vis.proceedButton.append("text")
            .attr("x", vis.width / 2 + 170)
            .attr("y", vis.height - 30)
            .attr("text-anchor", "middle")
            .text("Proceed");

        vis.proceedButton.on("click", function() {
            document.getElementById("section8")
                .scrollIntoView({
                    behavior: 'smooth'
                }); }
        );

        vis.wrangleData();
        vis.updateVis();
    }


    wrangleData() {
        let vis = this;

        vis.displayData = [];
        if (vis.baseline == "same_mbti"){
            let matchingRow = vis.mbtiGenreData.find(r => r.mbti == vis.selectedMbti[0]);
            for (let key in matchingRow) {
                if (key !== "mbti" && key !== "average") {
                    vis.displayData.push({
                        "genre": key,
                        "rating": matchingRow[key],
                        "rating_relative": matchingRow[key] - matchingRow.average
                    });
                }
            }
        } else if (vis.baseline == "all_people") {
            vis.genreMbtiData.forEach(d => vis.displayData.push({
                "genre": d.genre,
                "rating": d[vis.selectedMbti[0]],
                "rating_relative": d[vis.selectedMbti[0]] - d.average
            }));
        }

        console.log(vis.displayData);

        vis.updateVis();
    }


    updateVis() {
        let vis = this;

        vis.domain = [
            d3.min(vis.displayData, d => Math.abs(d.rating_relative)),
            d3.max(vis.displayData, d => Math.abs(d.rating_relative))
        ];

        // Define the radius scale
        vis.r.domain(vis.domain);
        vis.colorPositive.domain(vis.domain);
        vis.colorNegative.domain(vis.domain);

        vis.nodes = vis.displayData.map(d => ({
            ...d,
            radius: vis.r(Math.abs(d.rating_relative)),
            x: vis.width / 2,
            y: Math.random() * vis.height
        }))

        vis.circles = vis.svg.selectAll('.genre-bubble-circle')
            .data(vis.nodes, d => d.genre);

        // Remove existing circles that are no longer bound to data
        vis.circles.exit().remove();

        // Enter new circles
        vis.circles.enter()
            .append("circle")
            .attr("class", "genre-bubble-circle")
            .merge(vis.circles)  // Merge existing and new circles
            .attr("r", d => d.radius)
            .attr("fill", d => {
                if (d.rating_relative >= 0) { return vis.colorPositive(Math.abs(d.rating_relative)); }
                else { return vis.colorNegative(Math.abs(d.rating_relative)); }
            })
            .style("stroke", "black")
            .style("stroke-width", "2px");

        vis.svg.selectAll('.genre-bubble-circle')
            .on('mouseover', function(event, d) { vis.handleMouseOver(this, event, d, vis); } )
            .on('mouseout', function(event, d) { vis.handleMouseOut(this, event, d, vis); } );

        // Update the data binding for labels
        vis.labels = vis.svg.selectAll('.genre-bubble-label')
            .data(vis.nodes, d => d.genre);

        // Remove existing labels that are no longer bound to data
        vis.labels.exit().remove();

        // Enter new labels
        vis.labels.enter()
            .append("text")
            .attr("class", "genre-bubble-label")
            .merge(vis.labels)  // Merge existing and new labels
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .attr("dy", "0.35em")
            .text(d => vis.getDisplayGenre(d.genre));

        vis.svg.selectAll('.genre-bubble-label')
            .on('mouseover', function(event, d) { vis.handleMouseOver(this, event, d, vis); } )
            .on('mouseout', function(event, d) { vis.handleMouseOut(this, event, d, vis); } );

        // Restart the simulation with each update
        vis.simulation.nodes(vis.nodes)
            .on('tick', ticked)
            .alpha(1)
            .restart();

        function ticked() {
            vis.circles
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
            vis.labels
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        }

    }

    charge(d) {
        return Math.pow(d.radius, 2.0) * 0.01
    }

    switchBaseline(event, vis) {
        if (vis.baseline == "same_mbti") {
            vis.baseline = "all_people";
            vis.svg.select("#test-genre-vis-header")
                .text(`As ${vis.selectedMbti[0]}, compared to population average, you`)
            vis.wrangleData();
        }
        else {
            vis.baseline = "same_mbti";
            vis.svg.select("#test-genre-vis-header")
                .text(`As ${vis.selectedMbti[0]}, you might`)
            vis.wrangleData();
        }
    }

    handleMouseOver(element, event, d, vis) {
        vis.selectedLabel = d3.select('#test_vis').selectAll('text')
            .filter(function() {
                let genre = vis.getDisplayGenre(d.genre);
                return d3.select(this).text() === genre;
            });
        vis.selectedLabel.text(d.rating_relative.toFixed(2));
    }

    handleMouseOut(element, event, d, vis) {
        vis.selectedLabel.text(d => vis.getDisplayGenre(d.genre));
    }

    getDisplayGenre(genre_code) {
        if (genre_code == "hip_hop") { return "Hip hop"; }
        else if (genre_code == "rnb") { return "R&B"; }
        else { return `${genre_code.charAt(0).toUpperCase() + genre_code.slice(1)}`; }
    }

    // TODO: handle click on proceed button

}