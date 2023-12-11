
class TestMbtiVis {
    constructor(_parentElement, _genreMbtiData, _mbtiGenreData, _selectedGenres) {
        this.parentElement = _parentElement;
        this.genreMbtiData = _genreMbtiData;
        this.mbtiGenreData = _mbtiGenreData;
        this.selectedGenres = _selectedGenres;

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
            .text(function() {
                if (vis.selectedGenres.length == 1) { return `As you like ${vis.selectedGenres}, you are`; }
                else if (vis.selectedGenres.length == 2) { return `As you like ${vis.selectedGenres[0]} and ${vis.selectedGenres[1]}, you are`; }
                else { return `As you like ${vis.selectedGenres[0]}, ${vis.selectedGenres[1]}, and ${vis.selectedGenres[2]}, you are`; }
            })
            .attr("x", vis.width/2)
            .attr("y", vis.height * 0.05)
            .style("text-anchor", "middle");
        vis.svg.append("text")
            .attr("id", "test-mbti-vis-label-positive")
            .text("Likely:")
            .attr("x", vis.width/4)
            .attr("y", vis.height * 0.15)
            .style("text-anchor", "middle");
        vis.svg.append("text")
            .attr("id", "test-mbti-vis-label-negative")
            .text("Unlikely:")
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

        // TODO: initialize tooltip

        // initialize scales
        vis.r = d3.scaleSqrt()
            .range([20, vis.width/14]);
        vis.colorPositive = d3.scaleSequential()
            .range(["#FFFFFF", "#6C6CA5"]);
        vis.colorNegative = d3.scaleSequential()
            .range(["#FFFFFF", "#6e6b62"]);


        vis.centers = {
            positive: {x: vis.width*0.2, y: vis.height*0.6},
            neutral: {x: vis.width*0.5, y: vis.height*0.3},
            negative: {x: vis.width*0.8, y: vis.height*0.6}
        };


        // initialize simulation:
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

        vis.baseline = 'same_genres';


        vis.shuffleButton = vis.svg.append("g")
            .attr("class", "button shuffle-button")
            .attr("id", "shuffle-button-mbti");

        vis.shuffleButton.append("rect")
            .attr("x", vis.width / 2 - 130)
            .attr("y", vis.height - 50)
            .attr("width", 100)
            .attr("height", 30)
            .attr("fill", "#FFFFFF")
            .style("stroke", "black")
            .style("stroke-width", "2px");

        vis.shuffleButton.append("text")
            .attr("x", vis.width / 2 - 80)
            .attr("y", vis.height - 30)
            .attr("text-anchor", "middle")
            .text("Shuffle");

        vis.shuffleButton.on("click", function() { vis.wrangleData(); } );

        vis.proceedButton = vis.svg.append("g")
            .attr("class", "button proceed-button")
            .attr("id", "proceed-button-mbti");

        vis.proceedButton.append("rect")
            .attr("x", vis.width / 2 + 30)
            .attr("y", vis.height - 50)
            .attr("width", 100)
            .attr("height", 30)
            .attr("fill", "#FFFFFF")
            .style("stroke", "black")
            .style("stroke-width", "2px");

        vis.proceedButton.append("text")
            .attr("x", vis.width / 2 + 80)
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

        vis.selectedGenres = vis.selectedGenres.map(genre => {
            if (genre == "R&B") {return "rnb";}
            else if (genre == "hip hop") {return "hip_hop";}
            else {return genre.toLowerCase();}
        })

        console.log(vis.selectedGenres);

        vis.displayData = [];
        if (vis.baseline == "same_genres") {
            // Sorry to anyone who's reading this. I just wanted to get things to work.
            if (vis.selectedGenres.length == 1) {
                let matchingRow1 = vis.genreMbtiData.find(r => r.genre == vis.selectedGenres[0]);
                for (let key in matchingRow1) {
                    if (key !== "genre" && key !== "average") {
                        vis.displayData.push({
                            "mbti": key,
                            "rating": matchingRow1[key],
                            "rating_relative": matchingRow1[key] - matchingRow1.average
                        });
                    }
                }
            } else if (vis.selectedGenres.length == 2) {
                let matchingRow1 = vis.genreMbtiData.find(r => r.genre == vis.selectedGenres[0]);
                let matchingRow2 = vis.genreMbtiData.find(r => r.genre == vis.selectedGenres[1]);
                for (let key in matchingRow1) {
                    if (key !== "genre" && key !== "average") {
                        let rating = matchingRow1[key] * 0.6 + matchingRow2[key] * 0.4;
                        let average = matchingRow1.average * 0.6 + matchingRow2.average * 0.4;
                        vis.displayData.push({
                            "mbti": key,
                            "rating": rating,
                            "rating_relative": rating - average
                        });
                    }
                }
            } else if (vis.selectedGenres.length == 3) {
                let matchingRow1 = vis.genreMbtiData.find(r => r.genre == vis.selectedGenres[0]);
                let matchingRow2 = vis.genreMbtiData.find(r => r.genre == vis.selectedGenres[1]);
                let matchingRow3 = vis.genreMbtiData.find(r => r.genre == vis.selectedGenres[2]);
                for (let key in matchingRow1) {
                    if (key !== "genre" && key !== "average") {
                        let rating = matchingRow1[key] * 0.5 + matchingRow2[key] * 0.3 + matchingRow3[key] * 0.2;
                        let average = matchingRow1.average * 0.5 + matchingRow2.average * 0.3 + matchingRow3.average * 0.2;
                        vis.displayData.push({
                            "mbti": key,
                            "rating": rating,
                            "rating_relative": rating - average
                        });
                    }
                }
            }
        } else if (vis.baseline == "all_people") {
            vis.mbtiGenreData.forEach(d => {
                    if (vis.selectedGenres.length == 1) {
                        d.rating = d[vis.selectedGenres[0]];
                    } else if (vis.selectedGenres.length == 2) {
                        d.rating = d[vis.selectedGenres[0]] * 0.6 + d[vis.selectedGenres[1]] * 0.4;
                    } else {
                        d.rating = d[vis.selectedGenres[0]] * 0.5 + d[vis.selectedGenres[1]] * 0.3  + d[vis.selectedGenres[2]] * 0.2;
                    }
                }
            )
            vis.mbtiGenreData.forEach(d => vis.displayData.push({
                "mbti": d.mbti,
                "rating": d.rating,
                "rating_relative": d.rating - d.average
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

        vis.circles = vis.svg.selectAll('.mbti-bubble-circle')
            .data(vis.nodes, d => d.mbti);

        // Remove existing circles that are no longer bound to data
        vis.circles.exit().remove();

        // Enter new circles
        vis.circles.enter()
            .append("circle")
            .attr("class", "mbti-bubble-circle")
            .merge(vis.circles)  // Merge existing and new circles
            .attr("r", d => d.radius)
            .attr("fill", d => {
                if (d.rating_relative >= 0) { return vis.colorPositive(Math.abs(d.rating_relative)); }
                else { return vis.colorNegative(Math.abs(d.rating_relative)); }
            })
            .style("stroke", "black")
            .style("stroke-width", "2px");

        vis.svg.selectAll('.mbti-bubble-circle')
            .on('mouseover', function(event, d) { vis.handleMouseOver(this, event, d, vis); } )
            .on('mouseout', function(event, d) { vis.handleMouseOut(this, event, d, vis); } );

        // Update the data binding for labels
        vis.labels = vis.svg.selectAll('.mbti-bubble-label')
            .data(vis.nodes, d => d.mbti);

        // Remove existing labels that are no longer bound to data
        vis.labels.exit().remove();

        // Enter new labels
        vis.labels.enter()
            .append("text")
            .attr("class", "mbti-bubble-label")
            .merge(vis.labels)  // Merge existing and new labels
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .attr("dy", "0.35em")
            .text(d => `${d.mbti}`);

        vis.svg.selectAll('.mbti-bubble-label')
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
        if (vis.baseline == "same_genres") {
            vis.baseline = "all_people";
            vis.svg.select("#test-genre-vis-header")
                .text(`As you like ${vis.selectedGenres}, compared to population average, you are`)
            vis.wrangleData();
        }
        else {
            vis.baseline = "same_genres";
            vis.svg.select("#test-genre-vis-header")
                .text(`As you like ${vis.selectedGenres}, you are`)
            vis.wrangleData();
        }
    }

    handleMouseOver(element, event, d, vis) {
        vis.selectedLabel = d3.select('#test_vis').selectAll('text')
            .filter(function() {
                return d3.select(this).text() === d.mbti;
            });
        vis.selectedLabel.text(d.rating_relative.toFixed(2));
    }

    handleMouseOut(element, event, d, vis) {
        vis.selectedLabel.text(d.mbti);
    }

    // TODO: handle click on proceed button

}