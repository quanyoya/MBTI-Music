class TestSelection {
    constructor(_parentElement, _mbtiTestData, _genreData) {
        this.parentElement = _parentElement;
        this.mbtiTestData = _mbtiTestData;
        this.genreData = _genreData;

        this.genreList = [];
        this.genreListKey = [];
        this.genreData.forEach(d => {
            this.genreList.push(d.genre);
            if (d.genre == "R&B") {
                this.genreListKey.push("rnb");
            } else if (d.genre == "hip hop") {
                this.genreListKey.push("hip_hop");
            } else {
                this.genreListKey.push(d.genre.toLowerCase());
            }
        });
        this.genreList.sort((a,b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        this.mbtiList = ["INTJ", "INTP", "ENTJ", "ENTP",
            "INFJ", "INFP", "ENFJ", "ENFP",
            "ISTJ", "ISFJ", "ESTJ", "ESFJ",
            "ISTP", "ISFP", "ESTP", "ESFP"]

        this.mbtiTestData = this.mbtiTestData.map(row => {
            row['rating_folk'] = row['rating_indie_folk'];
            delete row['rating_indie_folk'];
            return row;
        });

        this.wrangleGenreMbtiData(this);
        this.wrangleMbtiGenreData(this);

        this.initVis();
    }

    initVis() {
        let vis = this;

        // define margins
        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // set up page structure
        vis.testRow = d3.select(`#${vis.parentElement}`)
            .append('div')
            .attr("class", "row")
            .attr('id', 'test-row');

        vis.buttonRow = d3.select(`#${vis.parentElement}`)
            .append('div')
            .attr("class", "row")
            .attr("id", "button-row");

        vis.genreTestCol = vis.testRow.append("div")
            .attr("class", "col-6 test-col")
            .attr("id", "genre-test-col");

        vis.mbtiTestCol = vis.testRow.append("div")
            .attr("class", "col-6 test-col")
            .attr("id", "mbti-test-col");

        // add instructions

        vis.genreInstruction = vis.genreTestCol.append("div")
            .attr("class", "row")
            .attr("id", "genre-instruction-container")
            .append("div")
            .html(`<div id="genre-instruction">Select up to 3 of your favorite genres</div>
                   <div id="genre-instruction-foot">(and we'll guess your MBTI)</div>`);

        vis.genreIcon = vis.genreTestCol.append("div")
            .attr("class", "row")
            .attr("id", "genre-icon-container")
            .append("img")
            .attr("src", "img/genre_unknown.png")
            .style("width", "40%");

        vis.mbtiInstruction = vis.mbtiTestCol.append("div")
            .attr("class", "row")
            .attr("id", "mbti-instruction-container")
            .append("div")
            .html(`<div id="mbti-instruction">Select your MBTI personality type:</div>
                   <div id="mbti-instruction-foot">(and we'll guess your favorite music genre)</div>`);

        vis.mbtiIcon = vis.mbtiTestCol.append("div")
            .attr("class", "row")
            .attr("id", "mbti-icon-container")
            .append("img")
            .attr("src", "img/mbti_unknown.png")
            .style("width", "40%");

        vis.testRow.append("text")
            .text("OR")
            .style("left", `${vis.width/2-12}px`)
            .style("top", `${40}px`)
            .style("font-size", `x-large`)
            .style("text-align", "center")
            .style("position", "absolute")
            .style("width", `50px`);

        // add selection buttons

        vis.genreButtonGroup = vis.genreTestCol.append("div")
            .attr("class", "row")
            .attr("id", "genre-button-container")
            .append("g")
            .attr("class", "button genre-button")
            .style("width", "70%");

        vis.mbtiButtonGroup = vis.mbtiTestCol.append("div")
            .attr("class", "row")
            .attr("id", "mbti-button-container")
            .append("g")
            .attr("class", "button mbti-button")
            .style("width", "70%");

        // add confirm button

        vis.confirmButton = vis.buttonRow.append("button")
            .text("Confirm")
            .attr("class", "button")
            .attr("id", "confirm-button")
            .style("width", "10%");


        // initialize selected items
        vis.selectedGenres = [];
        vis.selectedMbti = [];

        vis.wrangleData();
    }


    wrangleData() {
        let vis = this;

        vis.displayGenreList = vis.genreList;
        vis.displayMbtiList = vis.mbtiList;

        vis.updateVis();
    }


    updateVis() {
        let vis = this;

        // add genre selection buttons
        vis.genreButtons = vis.genreButtonGroup.selectAll(".genre-button")
            .data(vis.displayGenreList);
        vis.genreButtons.enter()
            .append("button")
            .attr("class", "genre-button")
            .merge(vis.genreButtons)
            .transition()
            .duration(200)
            .text(d => d.charAt(0).toUpperCase() + d.slice(1))
            .style("min-width", `${vis.width / 2 * 0.7 / 4 - 12}px`)
            .style("background-color", d => {
                if (vis.selectedGenres.length > 0 && vis.selectedGenres[0] == d) { return "#6C6CA5"; }
                else if (vis.selectedGenres.length > 1 && vis.selectedGenres[1] == d) { return "#9090BA"; }
                else if (vis.selectedGenres.length > 2 && vis.selectedGenres[2] == d) { return "#BDBDD6"; }
                else { return "#ffffff" }
            })
        vis.genreButtonGroup.selectAll(".genre-button")
            .on("click", function(event, d)  { vis.handleMouseClickOnGenreButton(this, event, d, vis); } );

        // add mbti selection buttons
        vis.mbtiButtons = vis.mbtiButtonGroup.selectAll(".mbti-button")
            .data(vis.displayMbtiList);
        vis.mbtiButtons.enter()
            .append("button")
            .attr("class", "mbti-button")
            .merge(vis.mbtiButtons)
            .transition()
            .duration(200)
            .text(d => d)
            .style("width", `${vis.width / 2 * 0.7 / 4 - 12}px`)
            .style("background-color", d => {
                if (vis.selectedMbti.includes(d)) { return "#8282B2"; }
                else { return "#ffffff" }
            })
        vis.mbtiButtons = vis.mbtiButtonGroup.selectAll(".mbti-button")
            .on("click", function(event, d)  { vis.handleMouseClickOnMbtiButton(this, event, d, vis); } );
        vis.mbtiButtons.exit().remove();

        if (vis.selectedGenres.length > 0 || vis.selectedMbti.length > 0) {
            vis.confirmButton
                .transition()
                .duration(200)
                .style("background-color", "#FFFFFF");
            vis.confirmButton
                .on("click", function(event) { vis.handleMouseClickOnConfirm(event, vis) });
        } else {
            vis.confirmButton
                .transition()
                .duration(200)
                .style("background-color", "#AAAAAA");
            vis.confirmButton
                .on("click", null);
        }

        if (vis.selectedGenres.length == 0) {
            vis.genreIcon.attr("src", "img/genre_unknown.png");
        } else {
            vis.genreIcon.attr("src", `img/genre_figures/${vis.selectedGenres[0]}.png`);
        }

        if (vis.selectedMbti.length == 0) {
            vis.mbtiIcon.attr("src", "img/mbti_unknown.png");
        } else {
            vis.mbtiIcon.attr("src", `img/MBTI/${vis.selectedMbti[0].toUpperCase()}.png`);
        }

    }


    handleMouseClickOnGenreButton(element, event, d, vis) {

        // clear mbti selection
        vis.selectedMbti = [];

        // current selection in existing selection
        if (vis.selectedGenres.includes(d)) {
            // clear current selection
            vis.selectedGenres.splice(vis.selectedGenres.indexOf(d), 1);
        // current selection not in existing selection
        } else {
            // <3 existing selection
            if (vis.selectedGenres.length < 3) {
                // add current selection to end of list
                vis.selectedGenres.push(d);
                // >=3 existing selection
            } else {
                // replace last element with current selection
                vis.selectedGenres.pop();
                vis.selectedGenres.push(d);
            }
        }

        vis.wrangleData();

    }


    handleMouseClickOnMbtiButton(element, event, d, vis) {

        // clear genre selection
        vis.selectedGenres = [];

        // no existing selection, or current selection is different from existing selection
        if (vis.selectedMbti.length == 0 || vis.selectedMbti[0] != d) {
            // update selection to be current selection
            vis.selectedMbti = [d];
        // current selection is same as existing selection
        } else {
            // clear current selection
            vis.selectedMbti = [];
        }
        vis.updateVis();
    }


    handleMouseClickOnConfirm(event, vis) {

        // first time doing the test
        if (!vis.testCompleted) {

            // mark test as completed
            vis.testCompleted = true;

            // display appropriate result visualization
            let testVis;
            // selected genre, display MBTI rankings
            if (vis.selectedGenres.length > 0 && vis.selectedGenres.length <= 3) {
                testVis = new TestMbtiVis("test_vis", vis.genreMbtiData, vis.mbtiGenreData, vis.selectedGenres);
                // selected MBTI, display genre rankings
            } else if (vis.selectedMbti.length == 1) {
                testVis = new TestGenreVis("test_vis", vis.genreMbtiData, vis.mbtiGenreData, vis.selectedMbti);
            } else {
                console.log("error in selection");
            }

            // scroll to result visualization
            document.getElementById("section7").scrollIntoView({
                behavior: 'smooth'
            });

            // disable all buttons
            vis.confirmButton
                .transition()
                .duration(200)
                .style("background-color", "#AAAAAA");
            vis.confirmButton
                .on("click", null);
            vis.genreButtonGroup.selectAll(".genre-button")
                .transition()
                .duration(200)
                .style("background-color", "#AAAAAA");
            vis.genreButtonGroup.selectAll(".genre-button")
                .on("click", null);
            vis.mbtiButtonGroup.selectAll(".mbti-button")
                .transition()
                .duration(200)
                .style("background-color", "#AAAAAA");
            vis.mbtiButtonGroup.selectAll(".mbti-button")
                .on("click", null);
        }

    }

    wrangleGenreMbtiData(vis) {
        vis.genreMbtiData = {};
        vis.genreListKey.forEach(genre => {
            vis.genreMbtiData[genre] = { genre, average: 0, counts: 0 };
            vis.mbtiTestData.forEach(record => {
                // If the genreData object is initialized, add the rating
                vis.genreMbtiData[genre][record.mbti_type] = vis.genreMbtiData[genre][record.mbti_type] || [];
                let rating = record[`rating_${genre}`];
                if (rating !== null) {
                    vis.genreMbtiData[genre][record.mbti_type].push(rating);
                    // Update the overall average for the genre
                    vis.genreMbtiData[genre].average += rating;
                    vis.genreMbtiData[genre].counts += 1;
                }
            });
        });

        vis.genreListKey.forEach(genre => {
            let genreObj = vis.genreMbtiData[genre];

            if (genreObj.average != 0) {
                genreObj.average /= genreObj.counts;
                delete genreObj.counts;
                delete genreObj.null;

                Object.keys(genreObj)
                    .filter(mbti => mbti !== "genre" && mbti !== "average")
                    .forEach(mbti => {
                        let ratings = genreObj[mbti];
                        genreObj[mbti] = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
                    });
            }
        });

        vis.genreMbtiData = vis.genreListKey.map(genre => {
            let genreObj = vis.genreMbtiData[genre];
            return {
                genre: genreObj.genre,
                average: genreObj.average,
                ...genreObj, // Spread the MBTI types and their averages
            };
        });
    }

    wrangleMbtiGenreData(vis) {
        vis.mbtiGenreData = {};

        vis.mbtiList.forEach(mbti => {
            vis.mbtiGenreData[mbti] = { mbti, average: 0, counts: 0 };
        });

        vis.mbtiTestData.forEach(record => {
            let mbti = record.mbti_type;
            if (mbti != null) {
                for (let [key, value] of Object.entries(record)) {
                    if (key.substring(0,6) == "rating") {
                        vis.mbtiGenreData[mbti][key.substring(7)] = vis.mbtiGenreData[mbti][key.substring(7)] || [];
                        if (value != null) {
                            vis.mbtiGenreData[mbti][key.substring(7)].push(value);
                            vis.mbtiGenreData[mbti].average += value;
                            vis.mbtiGenreData[mbti].counts += 1;
                        }
                    }
                }
            }
        });

        vis.mbtiList.forEach(mbti => {
            let mbtiObj = vis.mbtiGenreData[mbti];

            if (mbtiObj.average != 0) {
                mbtiObj.average /= mbtiObj.counts;
                delete mbtiObj.counts;

                Object.keys(mbtiObj)
                    .filter(genre => genre !== "mbti" && genre !== "average")
                    .forEach(genre => {
                        let ratings = mbtiObj[genre];
                        mbtiObj[genre] = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
                    });
            }
        });

        vis.mbtiGenreData = vis.mbtiList.map(mbti => {
            let mbtiObj = vis.mbtiGenreData[mbti];
            return {
                mbti: mbtiObj.mbti,
                average: mbtiObj.average,
                ...mbtiObj,
            };
        });
    }

}