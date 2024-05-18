function showBubbleChart() {
    document.getElementById('daviz').style.display = 'none';
    document.getElementById('bubble-chart').style.display = 'block';
    document.getElementById('back-button').style.display = 'block';
    // Assume loadBubbleChart is a function that setups the bubble chart
    loadBubbleChart();
}

function showDaviz() {
    document.getElementById('daviz').style.display = 'block';
    document.getElementById('bubble-chart').style.display = 'none';
    document.getElementById('back-button').style.display = 'none';
    // Reload or refresh Daviz if necessary
    loadDaviz();
}

function loadBubbleChart() {
    // Your D3 code to draw the bubble chart

        function goBack() {
            window.history.back();  // Uses the browser's history stack to navigate back
        }
        function getQueryParam(param) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        }

        const imdbRange = getQueryParam('range');
        const year = parseInt(getQueryParam('year'));

        fetch('detailed_data.json')
        .then(response => response.json())
        .then(data => {
            const filteredData = data.filter(item => item.rating_range === imdbRange && item.release_year === year);

            // Aggregate actors by genre for total count and top actors
            const genreMap = {};
            filteredData.forEach(item => {
                item.genres.forEach((genre, index) => {
                    if (!genreMap[genre]) {
                        genreMap[genre] = {
                            totalActors: [],
                            topActors: []
                        };
                    }

                    genreMap[genre].totalActors.push({
                        name: item.name[index],
                        score: item.imdb_score[index]
                    });
                });
            });

            // Sort and slice for top 10 actors
            Object.keys(genreMap).forEach(genre => {
                genreMap[genre].topActors = genreMap[genre].totalActors
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10);
            });

            const genres = Object.keys(genreMap).map(genre => ({
                genre: genre,
                actors: genreMap[genre].totalActors,
                topActors: genreMap[genre].topActors,
                total: genreMap[genre].totalActors.length
            }));

            const diameter = 600;
            const svg = d3.select("#bubble-chart").append("svg")
                .attr("width", diameter)
                .attr("height", diameter);

            const bubble = d3.pack()
                .size([diameter, diameter])
                .padding(2);

            const root = d3.hierarchy({children: genres}).sum(d => d.total);  // Sum using the total number of actors

            const bubbleLayout = d3.pack()
                .size([diameter, diameter])
                .padding(2);

            const nodes = bubbleLayout(root).leaves();  // Generating nodes



            const node = svg.selectAll(".node")
                .data(nodes)
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", d => `translate(${d.x}, ${d.y})`);

            node.append("circle")
                .attr("r", d => d.r)
                .style("fill", (d, i) => d3.schemeCategory10[i % 10]);

            node.append("text")
                .attr("dy", ".2em")
                .style("text-anchor", "middle")
                .text(d => d.data.genre.substring(0, d.r / 3))
                .attr("font-size", d => d.r / 5);

                node.on("click", d => {
        const data = d.target.__data__;
        console.log(data);
        const infoDiv = document.getElementById("info");
        if (data.data.topActors) {
            // Create HTML content for the list of top actors
            let content = `<h3>Top Actors in ${data.data.genre}</h3><ul>`;
            data.data.topActors.forEach(actor => {
                content += `<li>${actor.name} (Score: ${actor.score})</li>`;
            });
            content += `<p>Total Actors: ${data.data.total}</p>`;
            content += '</ul>';

            // Display the content in the info div
            infoDiv.innerHTML = content;
            infoDiv.style.display = 'block'; // Make the info div visible
        } else {
            infoDiv.innerHTML = '<p>No actor data available for this genre.</p>';
            infoDiv.style.display = 'block';
        }
    });
        });

}

function loadDaviz() {
    // Your D3 code to draw the bar chart (Daviz)
    fetch('data/other/detailed_data.json')
        .then(response => response.json())
        .then(data => {
            //console.log(data);
            let release_years = [...new Set(data.map(item => item.release_year))].sort();
            //release_years=release_years.filter(item=> item.release_year>=2000);
            const ranges = [...new Set(data.map(item => item.rating_range))];
            //console.log(ranges);
            const traces = ranges.map(range => {
    let countsPerYear = new Array(release_years.length).fill(0);
    let namesPerYear = new Array(release_years.length).fill('');
    let genresPerYear=new Array(release_years.length).fill('');
    let custom=new Array(release_years.length).fill()

    // Go through each year and calculate the total counts and names for that year and range.
    release_years.forEach((year, index) => {
    // Filter the data for the current year and rating range.
    let itemsForYearAndRange = data.filter(item => item.rating_range === range && item.release_year === year);

    // Assuming item.name is an array of names, sum the lengths for the count.
    countsPerYear[index] = itemsForYearAndRange
        .map(item => item.name.length)
        .reduce((a, b) => a + b, 0);

    // Join the names for custom data, assuming each item.name is an array of actor names.
    namesPerYear[index] = itemsForYearAndRange
        .flatMap(item => item.name) // Flatten the array of names arrays into a single array.
        .join(', '); // Join all names with a comma.
    genresPerYear[index] = itemsForYearAndRange.flatMap(item => item.genres).join(', ');
    custom[index]= { genre: genresPerYear[index], names: namesPerYear[index]}

    });


                return {
                    x: release_years,
                    y: countsPerYear,
                    name: range,
                    type: 'bar',
                    customdata: custom, // Include name as custom data
                    hoverinfo: 'y+name'
                };

            }
          );
          //console.log(traces);



            const layout = {
                barmode: 'stack',
                hovermode: 'closest',
                title: 'Number of name in IMDb Rating Ranges per release_year',
                xaxis: {title: 'release_year'},
                yaxis: {title: 'Number of name'},
                legend: {title: 'IMDb Rating Range'}
            };

            Plotly.newPlot('actor-chart', traces, layout);

            document.getElementById('actor-chart').on('plotly_click', function(data){
            console.log('All data points:', data.points);

            const imdbRange = data.points[0].data.name;
            console.log(data.points[0]);
            const year = data.points[0].x;
            window.location.href = `bubble.html?range=${encodeURIComponent(imdbRange)}&year=${encodeURIComponent(year)}`;
              });
        });
      d3.selectAll('.bar').on('click', function(event, d) {
      showBubbleChart();  // This will switch to the bubble chart
});

}

// Initially load Daviz
loadDaviz();
