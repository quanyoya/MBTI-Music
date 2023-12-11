class mbtiMapVis {

    constructor(_parentElement, _mbtiData, _geoData, _mbtiMapData) {
        this.parentElement = _parentElement;
        this.mbtiData = _mbtiData;
        this.geoData = _geoData;
        this.mbtiMapData = _mbtiMapData;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Create a main container
        vis.mainContainer = d3.select("#" + vis.parentElement)
            .append("div")
            .style("display", "flex")
            .style("align-items", "center");

        // Add a selection box for music types
        let selectContainer = vis.mainContainer.append("div")
            .attr("class", "select-container")
            .style("margin-left", "13%")
            .style("background", `url('img/sketch/rect_5_selection.png')`)
            .style("background-size", "100% 100%")
            .style("width", "10%")
            .style("height", "50px")
            .style("padding", "5px");

        d3.select(".select-container")
            .on("mouseover", function() {
                d3.select(this)
                    .style("transform", "scale(1.2)")
                    .style("cursor", "pointer");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .style("transform", "scale(1)");
            });

        // Extract unique genres
        vis.uniqueGenres = ["ENFJ", "ENFP", "ENTJ", "ENTP", "ESFJ", "ESFP", "ESTJ", "ESTP", "INFJ", "INFP", "INTJ", "INTP", "ISFJ", "ISFP", "ISTJ", "ISTP"];

        vis.mapMBTIToClass = function mapMBTIToClass(mbtiType) {
            switch (mbtiType) {
                case "ENTJ": case "ENTP": case "INTJ": case "INTP":
                    return "personality-color-analysts";
                case "ENFJ": case "ENFP": case "INFJ": case "INFP":
                    return "personality-color-diplomats";
                case "ESTJ": case "ESFJ": case "ISTJ": case "ISFJ":
                    return "personality-color-sentinels";
                case "ISTP": case "ESTP": case "ESFP": case "ISFP":
                    return "personality-color-explorers";
            }
        }

        vis.mbtiTypeSelect = selectContainer
            .append("select")
            .attr("class", "mbti-type-select")
            .style("border", "none")
            .style("background-color", "transparent")
            .style("color", "black");

        vis.mbtiTypeSelect.selectAll("option")
            .data(vis.uniqueGenres)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d)
            .attr("class", d => vis.mapMBTIToClass(d));


        vis.mapColorToClass = function (mbtiType) {
            switch (mbtiType) {
                case "ENTJ": case "ENTP": case "INTJ": case "INTP":
                    return ['rgba(224,156,202,0.66)', 'rgba(86,24,178,0.73)'];
                case "ENFJ": case "ENFP": case "INFJ": case "INFP":
                    return ['rgba(220,236,151,0.66)', 'rgba(4,222,143,0.73)'];
                case "ESTJ": case "ESFJ": case "ISTJ": case "ISFJ":
                    return ['rgba(171,224,202,0.66)', 'rgba(2,127,253,0.73)'];
                case "ISTP": case "ESTP": case "ESFP": case "ISFP":
                    return ['rgba(238,198,145,0.66)', 'rgba(255,98,0,0.73)'];
            }
        }

        vis.textSvg = vis.mainContainer.append("svg")
            .attr("width", "30%")
            .attr("height", vis.height)

        vis.foreignObject = vis.textSvg.append("foreignObject")
            .attr("width", "80%")
            .attr("height", vis.height)
            .attr("x", "20%")
            .attr("y", "20%");

        // mbti image container
        vis.imageContainer = d3.select("#" + vis.parentElement).select(".map-image-container");

        vis.imageContainer = vis.mainContainer.append("div")
            .attr("class", "map-image-container")
            .style("margin-left",  "-23%")
            .style("margin-top", "30%")
            .style("text-align", "center");

        // Append SVG to the main container
        vis.svg = vis.mainContainer.append("svg")

        //adjust the scale by zoom factor
        let zoomFactor = vis.width / 500;
        let defaultScale = 230;
        vis.mapPosition = 0.35;
        vis.projection = d3
            .geoOrthographic()
            // .geoStereographic()
            .clipAngle(90)
            .translate([vis.width * vis.mapPosition, vis.height / 2])
            .scale(defaultScale * zoomFactor);

        vis.path = d3.geoPath()
            .projection(vis.projection);

        // append tooltip
        vis.tooltip = vis.mainContainer.append('div')
            // .attr('class', "tooltip")
            .attr('id', 'map-tooltip')
            .style("opacity", 0);

        // hand sketch style texture
        vis.svg.append("defs")
            .append("pattern")
            .attr("id", "hand-drawn-texture")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 200)
            .attr("height", 200)
            .append("image")
            .attr("xlink:href", "img/sphere_texture.jpg")
            .attr("width", 200)
            .attr("height", 200);


        //sphere behind the map
        vis.sphere = vis.svg.append("path")
            .datum({type: "Sphere"})
            .attr("class", "graticule")
            .attr("fill", "url(#hand-drawn-texture)")
            .attr("stroke", "rgba(129,129,129,0.35)")
            .attr("d", vis.path);


        // Append legend group to the SVG
        vis.legendWidth = 200;
        vis.legendHeight = 20;
        vis.numSegments = 10;
        vis.legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width * vis.mapPosition - vis.legendWidth/2}, ${vis.height - 60})`);

        vis.countriesGroup = vis.svg.append("g")
            .attr("class", "countries");

        vis.wrangleData();

        // Set the initial selected music type
        vis.selectedMBTIType = vis.uniqueGenres[0];
        vis.onSelectionChange();
        vis.handleResize();


        window.addEventListener('resize', () => vis.handleResize());
        vis.mbtiTypeSelect.on("change", function() {
            vis.onSelectionChange();
        });
    }

    handleResize() {
        let vis = this;

        // Update width and height based on the new window size
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        //adjust the scale by zoom factor
        let zoomFactor = vis.width / 1000;
        let defaultScale = 200;

        vis.projection
            .translate([vis.width * vis.mapPosition, vis.height / 2])
            .scale(defaultScale * zoomFactor);

        vis.globeRadius = vis.projection.scale();

        // Update the SVG dimensions
        vis.svg.attr("width", vis.width * vis.mapPosition + vis.globeRadius)
            .attr("height", vis.height)

        vis.path.projection(vis.projection);
        vis.countriesGroup.selectAll(".country").attr("d", vis.path);
        vis.sphere.attr("d", vis.path);
        vis.legend.attr("transform", `translate(${vis.width * vis.mapPosition - vis.legendWidth/2}, ${vis.height - 60})`);

        vis.updateVis();
    }

    wrangleData() {
        let vis = this;

        // create random data structure with information for each land
        vis.countryInfo = {};

        let mbtiTypesAT = ["ESTJ-A", "ESFJ-A", "INFP-T", "ESFJ-T", "ENFP-T", "ENFP-A", "ESTJ-T", "ISFJ-T", "ENFJ-A", "ESTP-A", "ISTJ-A", "INTP-T", "INFJ-T", "ISFP-T", "ENTJ-A", "ESTP-T", "ISTJ-T", "ESFP-T", "ENTP-A", "ESFP-A", "INTJ-T", "ISFJ-A", "INTP-A", "ENTP-T", "ISTP-T", "ENTJ-T", "ISTP-A", "INFP-A", "ENFJ-T", "INTJ-A", "ISFP-A", "INFJ-A"];
        let mbtiTypes = ["ESTJ", "ESFJ", "INFP", "ESFJ", "ENFP", "ENFP", "ESTJ", "ISFJ", "ENFJ", "ESTP", "ISTJ", "INTP", "INFJ", "ISFP", "ENTJ", "ESTP", "ISTJ", "ESFP", "ENTP", "ESFP", "INTJ", "ISFJ", "INTP", "ENTP", "ISTP", "ENTJ", "ISTP", "INFP", "ENFJ", "INTJ", "ISFP", "INFJ"];

        vis.geoData.objects.countries.geometries.forEach(d => {
            let mbtiDataWithZeros = {};
            mbtiTypes.forEach(type => mbtiDataWithZeros[type] = 0);

            vis.countryInfo[d.properties.name] = {
                countryName: d.properties.name,
                mbtiData: mbtiDataWithZeros,
                color: "#ccc"
            };
        })

        vis.mbtiMapData.forEach(row => {
            if (vis.countryInfo.hasOwnProperty(row.Country)) {
                mbtiTypes.forEach(type => {
                    //NO A/T
                    let typeA = type + "-A";
                    let typeT = type + "-T";
                    row[typeA] = +row[typeA];
                    row[typeT] = +row[typeT];
                    vis.countryInfo[row.Country].mbtiData[type] = row[typeA] + row[typeT];

                    //Use A/T
                    // row[type] = +row[type];
                    // vis.countryInfo[row.Country].mbtiData[type] = row[type];
                });
            }
        });

        // Convert TopoJSON to GeoJSON (target object = 'states')
        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features;

        vis.colorScaleList = {};
        vis.uniqueGenres.forEach(type => {
            // Calculate values for current type
            let mbtiValues = Object.values(vis.countryInfo).map(country => country.mbtiData[type]);
            let mbtiNonZeroValues = mbtiValues.filter(value => value > 0);

            let maxValue = mbtiNonZeroValues.length > 0 ? Math.max(...mbtiNonZeroValues) : 0;
            let minValue = mbtiNonZeroValues.length > 0 ? Math.min(...mbtiNonZeroValues) : 0;

            // Create and store color scale for current type
            vis.colorScaleList[type] = d3.scaleLinear()
                .domain([minValue, maxValue])
                .range(vis.mapColorToClass(type));
        });

        vis.highestCountryByMbtiType = {};
        // Iterate over each MBTI type
        vis.uniqueGenres.forEach(mbtiType => {
            let highestValue = -Infinity;
            let highCountry = "";
            Object.entries(vis.countryInfo).forEach(([country, data]) => {
                let mbtiValue = data.mbtiData[mbtiType];
                if (mbtiValue > highestValue) {
                    highestValue = mbtiValue;
                    highCountry = country;
                }
            });
            vis.highestCountryByMbtiType[mbtiType] = highCountry;
        });

        vis.selectedMBTIType = vis.uniqueGenres[0];
    }

    onSelectionChange(){
        let vis = this;
        vis.selectedMBTIType = d3.select(vis.mbtiTypeSelect.node()).property("value");

        vis.imageContainer.selectAll("img").remove();

        vis.imageContainer.append("img")
            .attr("src", `img/MBTI/${vis.selectedMBTIType}.png`)
            .style("width", "250px")
            .style("height", "auto");

        vis.colorScale = vis.colorScaleList[vis.selectedMBTIType];

        Object.keys(vis.countryInfo).forEach(countryKey => {
            let countryData = vis.countryInfo[countryKey].mbtiData;
            let allZeros = Object.values(countryData).every(value => value === 0);
            let tooltipHtml;
            // If all values are zero, set color to grey, otherwise use the color scale
            if (allZeros) {
                vis.countryInfo[countryKey].color = "rgba(86,86,86,0.4)";
                tooltipHtml = `
                <div>
                    <strong><p>${countryKey}</p></strong>
                    <p>No Data</p>
                </div>`;
            } else {
                let mbtiValue = countryData[vis.selectedMBTIType];
                vis.countryInfo[countryKey].color = vis.colorScale(mbtiValue);

                let maxType = null, minType = null, maxValue = -Infinity, minValue = Infinity;
                Object.entries(countryData).forEach(([type, value]) => {
                    if (value > maxValue) {
                        maxValue = value;
                        maxType = type;
                    }
                    if (value < minValue) {
                        minValue = value;
                        minType = type;
                    }
                });

                maxValue = (maxValue * 100).toFixed(2);
                minValue = (minValue * 100).toFixed(2);
                mbtiValue = (mbtiValue * 100).toFixed(2);

                tooltipHtml = `
                <div>
                    <strong><p>${countryKey}</p></strong>
                    <p class="${vis.mapMBTIToClass(maxType)}">${maxType} (most): ${maxValue}%</p>
                    <p class="${vis.mapMBTIToClass(vis.selectedMBTIType)}">${vis.selectedMBTIType} (selected): ${mbtiValue}%</p>
                    <p class="${vis.mapMBTIToClass(minType)}">${minType} (least): ${minValue}%</p>
                </div>`;
            }
            vis.countryInfo[countryKey].tooltipHtml = tooltipHtml;
        });

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.colorScale = vis.colorScaleList[vis.selectedMBTIType];

        vis.highCountry = vis.highestCountryByMbtiType[vis.selectedMBTIType];

        vis.fontColor = vis.mapColorToClass(vis.selectedMBTIType)[1];
        let count = 0;
        for (let i = 0; i < vis.highCountry.length; i++) {
            if (vis.highCountry[i].match(/[a-zA-Z]/)) {
                count++;
            }
        }
        vis.highCountryPadding = 48.6 - 3.4*count;
        vis.foreignObject.selectAll('*').remove();
        vis.foreignObject.append("xhtml:div").attr("class", "map-text-svg")
            .html(`
                <h3 style="color: ${vis.fontColor};left: ${vis.highCountryPadding}%">${vis.highCountry}</h3>
                <br><br><br>
                <span> has the <strong style="color: ${vis.fontColor}">LARGEST</strong> percentage of</span>
                <p> 👇 personality type</p>
            `);

        //draw countries
        vis.countries = vis.countriesGroup
            .selectAll(".country")
            .data(vis.world);

        vis.countriesEnter = vis.countries.enter()
            .append("path")
            .attr('class', 'country')
            .attr("d", vis.path)
            .style("fill", d => {
                let countryName = d.properties.name;

                let mbtiValue = vis.countryInfo[countryName].mbtiData[vis.selectedMBTIType];
                return vis.colorScale(mbtiValue);
                // let countryInfo = vis.countryInfo[countryName];
                // return countryInfo.color;
            })

        //update
        vis.countriesEnter
            .merge(vis.countries)
            .transition()
            .duration(100)
            .style("fill", d => {
                let countryInfo = vis.countryInfo[d.properties.name];
                return countryInfo.color;
            });

        vis.countriesEnter
            .style("cursor", "pointer")
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', 'rgba(173,222,255,0.62)');

                vis.tooltip
                    .style("opacity", 1)
                    .style("background-image", `url('img/tooltip/tooltip_8.png')`)
                    .html(vis.countryInfo[d.properties.name].tooltipHtml)
                    .style("left", `${event.pageX/5+vis.width/2}px`)
                    .style("top", `${event.pageY/5-vis.height/1.5}px`);
            })
            .on('mouseout', function (event, d) {
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .attr('fill', d => {
                        let countryName = d.properties.name;
                        let countryInfo = vis.countryInfo[countryName];
                        return countryInfo.color;
                    });

                vis.tooltip
                    .style("opacity", 0)
                    .style("background-color", "transparent")
                    .html("");
            });

        vis.countries.exit().remove();

        //drag the ball
        let m0,o0;
        vis.svg.call(
            d3.drag()
                .on("start", function (event) {
                    let lastRotationParams = vis.projection.rotate();
                    m0 = [event.x, event.y];
                    o0 = [-lastRotationParams[0], -lastRotationParams[1]];
                })
                .on("drag", function (event) {
                    if (m0) {
                        let m1 = [event.x, event.y],
                            o1 = [o0[0] + (m0[0] - m1[0]) / 4, o0[1] + (m1[1] - m0[1]) / 4];
                        vis.projection.rotate([-o1[0], -o1[1]]);
                    }
                    // Update the map
                    vis.path = d3.geoPath().projection(vis.projection);
                    d3.selectAll(".country").attr("d", vis.path)
                    d3.selectAll(".graticule").attr("d", vis.path)
                })
        )

        //draw legend
        let legendScale = d3.scaleLinear()
            .domain(vis.colorScale.domain())
            .range([0, vis.legendWidth]);

        let left = vis.colorScale.domain()[0];
        let right = vis.colorScale.domain()[1];
        let middle = (left + right) / 2;

        let legendAxis = d3.axisBottom(legendScale)
            .ticks(3)
            .tickValues([left,middle, right])
            .tickFormat(d => `${(d * 100).toFixed(2)}%`);

        // Append the legend axis
        vis.legend.call(legendAxis)
            .selectAll(".tick text")
            .style("font-size", "15px");

        // Create legend segments
        let legendData = d3.range(vis.numSegments).map(i => {
            let [min, max] = vis.colorScale.domain();
            let step = (max - min) / vis.numSegments;
            return min + i * step;
        });

        let legendRects = vis.legend.selectAll(".legend-rect")
            .data(legendData);

        legendRects.exit().remove();

        legendRects.enter()
            .append("rect")
            .merge(legendRects)  // Enter + Update existing elements
            .attr("class", "legend-rect")
            .attr("x", d => legendScale(d))
            .attr("y", -vis.legendHeight)
            .attr("width", vis.legendWidth / vis.numSegments)
            .attr("height", vis.legendHeight)
            .attr("fill", d => vis.colorScale(d));
    }
}
