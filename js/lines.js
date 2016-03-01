// Try to use vanilla javascript instead of jQuery when possible!
// Much love <3

window.addEventListener('load', function() {
    var data, dates = [''], maxY = 0, r = 4, leaderName = '';

    var drawLines = function() {
        if (data == null || data.length <= 0) { return; }

        // Do our thing for every barchart container
        [].slice.call(document.querySelectorAll('.lines-container')).forEach(function(container) {
            var containerWidth = window.getInnerWidth(container, 0);
            if (containerWidth <= 0) { return; }

            var margin = { top : 20 , right : 30 , bottom : 20 , left : 30 };

            var width = containerWidth - (margin.left + margin.top),
                height = (window.innerHeight / 3) - (margin.top + margin.bottom),
                xScale = d3.scale.ordinal(),
                yScale = d3.scale.linear();

            xScale.domain(dates).rangeRoundPoints([0, width]);
            yScale.domain([0, 100]).range([height, 0]);

            var svg = d3.select(container).select('svg');
            if (svg[0][0] == null) {
                svg = d3.select(container).append('svg');
                svg.append('g').attr('class', 'axis').attr('transform', 'translate(0, ' + margin.top + ')');
                svg.append('g').attr('class', 'guides').attr('transform', 'translate(0, ' + margin.top + ')');
                svg.append('g').attr('class', 'lines').attr('transform', 'translate(0, ' + margin.top + ')');
                svg.append('g').attr('class', 'circles').attr('transform', 'translate(0, ' + margin.top + ')');
            }
            var guidesGroup = svg.select('g.guides'),
                axisGroup = svg.select('g.axis'),
                linesGroup = svg.select('g.lines'),
                circlesGroup = svg.select('g.circles');

            svg.attr('width', width).attr('height', height + (margin.top + margin.bottom));

            var axis = d3.svg.axis().scale(yScale).orient('right');

            var line = linesGroup.selectAll('.line').data(_.pairs(data), function(d) { return d[0]; }),
                guide = guidesGroup.selectAll('.guide').data(
                    _.range(
                        yScale.domain()[0],
                        yScale.domain()[1] + 1,
                        (yScale.domain()[1] - yScale.domain()[0]) / axis.ticks()[0]
                    )
                );
                circle = circlesGroup.selectAll('.circle').data(_.flatten(_.values(data)), function(d) {
                    return d.name + '_' + d.date;
                });

            guide.exit().remove();
            line.exit().remove();
            circle.exit().remove();

            guide.enter().append('line').attr('class', 'guide');
            line.enter().append('path').attr('class', 'line')
            circle.enter().append('circle').attr('class', 'circle');

            guide.attr({
                y1: function(d) { return yScale(d); },
                y2: function(d) { return yScale(d); },
                x1: xScale(dates[1]) - ((xScale(dates[1]) - xScale(dates[0])) / 2),
                x2: width
            });
            line.attr('d', function(d) {
                var path = '';
                for (var i = 0; i < d[1].length; ++i) {
                    path += (i === 0 ? 'M' : 'L') + ' ' + xScale(d[1][i].date)
                                                  + ' ' + yScale(d[1][i].score);
                }
                return path;
            }).attr('class', function(d) {
                return 'line' + ((d[0] === leaderName) ? ' gold' : '');
            });
            circle.attr({
                r: 4,
                cx: function(d) { return xScale(d.date); },
                cy: function(d) { return yScale(d.score); },
                class: function(d) {
                    return 'circle' + ((d.name === leaderName) ? ' gold' : '');
                }
            });

            // Hover on circles
            circle.on('mouseenter', function(d) {
                var tt = document.querySelector('.tt'),
                    text = d.name + '<br>' +
                           window.formatDate(d.date) + '<br>' +
                           String(d.score).replace(/\./g, ',') + '%';

                tt.classList.remove('hidden');
                tt.querySelector('p').innerHTML = text;
                tt.querySelector('.tt--arrow').style.opacity = 0;

                d3.select(this).attr('r', r * 1.5);
            });
            circle.on('mousemove', function(d) {
                var tt = document.querySelector('.tt'),
                    thisBoundingRect = this.getBoundingClientRect(),
                    left = thisBoundingRect.left,
                    ttHeight = tt.getBoundingClientRect().height;

                if (xScale(d.date) > containerWidth / 2) {

                } else {
                    left += 20;
                }

                tt.style.top = String(Math.min(
                    container.getBoundingClientRect().bottom - ttHeight + window.getScrollTop(),
                    thisBoundingRect.top + window.getScrollTop() - (ttHeight / 2)
                )) + 'px';
                tt.style.left = String(left) + 'px';
            });
            circle.on('mouseleave', function() {
                circle.attr('r', r);
                document.querySelector('.tt').classList.add('hidden');
            });

            // Axis
            axisGroup.call(axis);
        });
    };

    window.startLines = function(input) {
        data = _.zipObject(_.keys(input[0].results));
        var totals = _.clone(data),
            subTotal = 0,
            leader = ['', 0];
        _.each(_.groupBy(input, 'rawDate'), function(datum, key) {
            var item = _.zipObject(_.keys(input[0].results)),
                dayTotal = 0;
            _.each(datum, function(datum) {
                _.each(datum.results, function(result, candidate) {
                    totals[candidate] = (totals[candidate] || 0) + result.delegates;
                    item[candidate] = (item[candidate] || 0) + result.delegates;
                    dayTotal += result.delegates;
                });
            });
            subTotal += dayTotal;
            if (dayTotal > 0) {
                leader = ['', 0]
            }
            _.each(item, function(entry, key) {
                dates.push(datum[0].rawDate);
                if (dayTotal > 0) {
                    maxY = Math.max(maxY, totals[key]);
                    var score = parseInt(((totals[key] * 100) / subTotal) * 10) / 10;
                    data[key] = (data[key] || []).concat({
                        name : key,
                        date: datum[0].rawDate,
                        score: score
                    });
                    if (score >= leader[1]) {
                        leader[0] = key;
                        leader[1] = score;
                    }
                }
            });
        });

        data = _.zipObject(_.filter(_.pairs(data), function(datum) {
            if (datum[1] == null) { return; }
            for (var i = 0; i < datum[1].length; ++i) {
                if (datum[1][i].score > 0) {
                    return true;
                }
            }
            return false;
        }));

        leaderName = leader[0];

        // Call on resize
        window.addEventListener('resize', _.debounce(drawLines, 200));
        // Initial call
        drawLines();
    };
});
