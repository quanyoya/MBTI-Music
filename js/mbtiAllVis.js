class mbtiAllVis {

	constructor(_parentElement, _data,) {
		this.parentElement = _parentElement;
		this.data = _data;

		this.initVis();
	}

	initVis() {
		let vis = this;

		vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };

		vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
		vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

		vis.background = d3.select('#' + vis.parentElement)
			.style('background-image', 'url("img/background.jpg")')
			.style('background-size', `${vis.width+vis.margin.left+vis.margin.right}px ${vis.height+vis.margin.top*2+vis.margin.bottom}px`)
			.style('background-repeat', 'no-repeat');

		// Create a div for the images
		vis.imgContainer = d3.select('#' + vis.parentElement).append('div')
			.attr('class', 'img-container')
			.style('position', 'relative')
			.style('width', vis.width)
			.style('height', vis.height);

		vis.tooltipImages = [];
		for (let i = 1; i <= 7; i++) {
			vis.tooltipImages.push(`img/tooltip/tooltip_${i}.png`);
		}


		// Create button element
		let button = document.createElement('button');
		button.innerHTML = 'shuffle';
		button.style.position = 'absolute';
		button.style.top = '10%';
		button.style.left = '50%';
		button.style.transform = 'translateX(-50%)';
		button.style.backgroundImage = 'url("img/sketch/rect_5.png")';
		button.style.backgroundRepeat = 'no-repeat';
		button.style.backgroundSize = 'cover';
		button.style.backgroundColor = 'transparent';
		button.style.backgroundPosition = 'center';
		button.style.border = 'none';
		button.style.padding = '10px 20px';
		button.style.cursor = 'pointer';
		button.style.fontSize = '20px';

		// Add click event listener
		button.onclick = () => {
			vis.handleResize();
		};
		button.onmouseover = () => {
			button.style.fontSize = '30px';
			button.style.backgroundImage = 'url("img/sketch/rect_3.png")';
		}

		button.onmouseout = () => {
			button.style.fontSize = '20px';
			button.style.backgroundImage = 'url("img/sketch/rect_5.png")';
		}

		document.getElementById(vis.parentElement).appendChild(button);


		window.addEventListener('resize', () => vis.handleResize());
		vis.handleResize();
		vis.generateGridPoints();
	}

	handleResize() {
		let vis = this;

		// Update width and height based on the new window size
		vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
		vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

		vis.imgContainer.style('width', vis.width).style('height', vis.height);
		vis.background.style('background-size', `${vis.width+vis.margin.left+vis.margin.right}px ${vis.height+vis.margin.top*2+vis.margin.bottom}px`)

		vis.generateGridPoints();

	}

	generateGridPoints() {
		let vis = this;

		// Define the size of the pictures
		vis.imageSize = vis.height/5;
		vis.allPosition = 0.7;
		vis.widthMargin = 0.1;

		vis.gridWidth = vis.imageSize
		vis.gridHeight = vis.imageSize


		// Calculate the number of possible positions in the grid
		vis.gridCols = Math.floor(vis.width * (1- 2*vis.widthMargin) / vis.gridWidth);
		vis.gridWidth = vis.width * (1- 2*vis.widthMargin) / vis.gridCols;
		vis.gridRows = Math.floor(vis.height*vis.allPosition / vis.gridHeight);
		vis.gridHeight = vis.height*vis.allPosition / vis.gridRows;


		if (vis.gridCols * vis.gridRows < vis.data.length) {
			vis.gridCols = Math.ceil(vis.data.length / vis.gridRows);
			vis.gridWidth = vis.width * (1- 2*vis.widthMargin) / vis.gridCols;
		}

		// Create an array to store the grid positions
		vis.gridPoints = [];

		for (let row = 0; row < vis.gridRows; row++) {
			for (let col = 0; col < vis.gridCols; col++) {
				let y;
				if (row === (vis.gridRows - 1)) {
					y = (row + 0.5) * vis.gridHeight + (1 - vis.allPosition) * vis.height + (Math.random() - 1) * vis.gridHeight/2
				} else{
					y =  (row + 0.5) * vis.gridHeight + (1 - vis.allPosition) * vis.height + (Math.random() - 0.5) * vis.gridHeight
				}
				vis.gridPoints.push({
					x: (col + 0.5) * vis.gridWidth + vis.widthMargin * vis.width + (Math.random() - 0.5) * vis.gridWidth/2,
					y: y
				});
			}
		}

		console.log("2",vis.gridPoints);

		vis.shuffleArray();
		console.log("3",vis.gridPoints);

	}

	shuffleArray() {
		let vis = this;

		for (let i = vis.gridPoints.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[vis.gridPoints[i], vis.gridPoints[j]] = [vis.gridPoints[j], vis.gridPoints[i]];
		}

		vis.gridPoints.sort((a, b) => a.y - b.y);

		vis.updateVis();
	}

	updateVis() {
		let vis = this;
		vis.imgContainer.selectAll('*').remove();

		vis.data.forEach((d, index) => {
			if (index < vis.gridPoints.length) {
				let point = vis.gridPoints[index];

				// Create and append image
				let img = document.createElement('img');
				img.src = `img/MBTI/${d.mbti}.png`;
				img.alt = d.mbti;
				img.style.position = 'absolute';
				img.style.left = `${point.x}px`;
				img.style.top = `${point.y}px`;
				img.style.width = `${vis.imageSize}px`;
				img.style.height = `${vis.imageSize}px`;
				img.classList.add('mbti-img');
				vis.imgContainer.node().appendChild(img);

				// Create tooltip for this image
				let tooltip = document.createElement('div');
				tooltip.classList.add('mbti-tooltip');
				tooltip.innerHTML = `<strong>${d.mbti}</strong>: <br>${d.personality}`;
				let randomTooltip = vis.tooltipImages[Math.floor(Math.random() * vis.tooltipImages.length)];
				tooltip.style.backgroundImage = `url("${randomTooltip}")`;
				tooltip.style.display = 'none';
				vis.imgContainer.node().appendChild(tooltip);

				img.style.cursor = 'pointer';
				// Event listeners for showing/hiding tooltip
				img.onmouseover = () => {
					let tooltipWidth = 120;
					let tooltipHeight = 90;
					let leftPosition = img.offsetLeft + (vis.imageSize - tooltipWidth) / 2;
					let topPosition = img.offsetTop - tooltipHeight*0.6;

					if (topPosition < 0) {
						topPosition = img.offsetTop + vis.imageSize;
					}

					tooltip.style.left = `${leftPosition}px`;
					tooltip.style.top = `${topPosition}px`;
					tooltip.style.display = 'block';
				};

				img.onmouseout = () => {
					tooltip.style.display = 'none';
				};
			}
		});
	}


}