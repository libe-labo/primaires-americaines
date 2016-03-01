// Try to use vanilla javascript instead of jQuery when possible!
// Much love <3

window.addEventListener('load', function() {
    var LAYOUT = { HORIZONTAL : 0 , VERTICAL : 1 };
    var dropped = [ 'rand paul' , 'jeb bush' ];

    var data = [],
        total = 0,
        side = 'rep',
        head;

    var drawBars = function() {
        if (data == null || data.length <= 0) { return; }

        var hasDropped = function(d) {
            return dropped.indexOf(d.name.toLowerCase()) >= 0;
        };

        var getColor = function(d) {
            return d.isFirst ? '#d09f00' : hasDropped(d) ? '#e6e6e6' : d.color;
        };

        // Do our thing for every barchart container
        [].slice.call(document.querySelectorAll('.bars-container')).forEach(function(container) {
            var containerWidth = window.getInnerWidth(container, 0),
                containerHeight = window.getInnerHeight(container);

            var width = containerWidth,
                height,
                xScale, yScale,
                layout = window.innerWidth <= 990 ? LAYOUT.VERTICAL : LAYOUT.HORIZONTAL;

            // Set up scales
            if (layout === LAYOUT.HORIZONTAL) {
                xScale = d3.scale.linear().domain([0, total]).range([0, width]);
                var rangeBand = 40,
                    rangeBandPadding = rangeBand * 0.5;
                height = rangeBandPadding + ((rangeBand + rangeBandPadding) * data.length);
            } else if (layout === LAYOUT.VERTICAL) {
                height = containerHeight;
                xScale = d3.scale.ordinal().domain(_.pluck(data, 'name')).rangeRoundBands([0, width], 0.15, 0.15);
                yScale = d3.scale.linear().domain([0, total]).range([0, height]);
            }

            // Get or create SVG tag
            var svg = d3.select(container).select('svg');
            if (svg[0][0] == null) {
                svg = d3.select(container).append('svg');
                svg.append('defs');
                // svg.append('g').attr('class', 'guides');
                svg.append('g').attr('class', 'bars');
                svg.append('g').attr('class', 'circles');
                svg.append('g').attr('class', 'labels');
            }
            var defs = svg.select('defs'),
                // guidesGroup = svg.select('g.guides'),
                barsGroup = svg.select('g.bars'),
                circlesGroup = svg.select('g.circles'),
                labelsGroup = svg.select('g.labels');

            // Set SVG size
            svg.attr('width', width).attr('height', height);

            var pattern = defs.selectAll('pattern').data(data, function(d) { return d.name; }),
                bar = barsGroup.selectAll('.bar').data(data, function(d) { return d.name; }),
                circle = circlesGroup.selectAll('.circle').data(data, function(d) { return d.name; }),
                label = labelsGroup.selectAll('.label').data(data, function(d) { return d.name; }),
                name = labelsGroup.selectAll('.name').data([head], function(d) { return d.name; });

            // Remove old bars and guides
            pattern.exit().remove();
            bar.exit().remove();
            circle.exit().remove();
            label.exit().remove();
            name.exit().remove();

            // Append new ones
            pattern.enter().append('pattern').attr({
                id: function(d) { return d.name.split(' ')[1].replace(/'/, '').toLowerCase(); },
                patternUnits: 'objectBoundingBox',
                width: '100%',
                height: '100%',
                viewBox: '0 0 1 1',
                preserveAspectRatio: 'xMidYMid slice'
            }).append('image').attr({
                'xlink:href': function(d) {
                    return 'img/' + side + '/' +
                           d.name.split(' ')[1].replace(/'/, '').toLowerCase() +
                           (d.isFirst ? '-or' : hasDropped(d) ? '-gr' : '') +
                           '.jpg';
                },
                'width': 1,
                'height': 1,
                'preserveAspectRatio': 'xMidYMid slice'
            });
            bar.enter().append('rect').attr('class', 'bar');
            circle.enter().append('circle').attr('class', 'circle');
            label.enter().append('text').attr('class', 'label');
            name.enter().append('text').attr('class', 'name gold').text(function(d) { return d.name; });

            // Update size and position for everything left
            if (layout === LAYOUT.HORIZONTAL) {
                bar.attr({
                    x: 0,
                    y: function(datum, index) {
                        return rangeBandPadding + ((rangeBand + rangeBandPadding) * index);
                    },
                    width: function(d) { return xScale(d.score); },
                    height: rangeBand,
                }).style('fill', getColor);

                circle.attr({
                    cx: function(d) { return xScale(d.score); },
                    cy: function(d, i) {
                        return rangeBandPadding + ((rangeBand + rangeBandPadding) * i) + (rangeBand / 2);
                    },
                    r: (rangeBand * 1.3) / 2,
                    'xlink:href': function(d) {
                        return 'img/' + side + '/' + d.name.split(' ')[1].toLowerCase().replace(/'/, '') + '.png'
                    }
                }).style({
                    'fill': function(d) {
                        return 'url(#' + d.name.split(' ')[1].toLowerCase().replace(/'/, '') + ')';
                    },
                    'opacity': '1',
                    'pointer-events': 'all'
                });

                label.style({
                    'text-anchor' : function(d) { return d.percent >= 5 ? 'end' : 'start';  },
                    'pointer-events' : function(d) { return d.percent >= 5 ? 'none' : 'all';  },
                    'transform': function(d) {
                        return 'translateX(' + String(d.percent >= 5 ? -1.4 : 1.4) + 'em)' +
                               'translateY(.4em)';
                    }
                }).attr({
                    class : function(d) {
                        return 'label' + (d.percent < 5 ? ' inverse' : '') + (hasDropped(d) ? ' grey' : '');
                    },
                    x : function(d) { return xScale(d.score); },
                    y : function(d, i) {
                        return rangeBandPadding + ((rangeBand + rangeBandPadding) * i) + (rangeBand / 2);
                    }
                });

                name.attr({
                    x : function(d) { return xScale(d.score); },
                    y : function(d) {
                        var i = -1;
                        while (++i < data.length) {
                            if (data[i].name === d.name) {
                                break;
                            }
                        }
                        return rangeBandPadding + ((rangeBand + rangeBandPadding) * i) + (rangeBand / 2);
                    }
                }).style({
                    'transform': 'translateX(1.2em)' +
                                 'translateY(.4em)'
                });

                circle.on('mouseenter', function(d) {
                    var tt = document.querySelector('.tt');
                    tt.querySelector('p').innerHTML = d.name;
                    tt.classList.remove('hidden');
                    tt.querySelector('.tt--arrow').style.opacity = 0;
                });
                circle.on('mousemove', function() {
                    var tt = document.querySelector('.tt'),
                        thisBoundingRect = this.getBoundingClientRect();

                    tt.style.top = String(
                        thisBoundingRect.top + window.getScrollTop() +
                        (thisBoundingRect.height / 2) -
                        (tt.getBoundingClientRect().height / 2)
                    ) + 'px';
                    tt.style.left = String(thisBoundingRect.right + 4) + 'px';
                });
                circle.on('mouseleave', function() {
                    document.querySelector('.tt').classList.add('hidden');
                });
            } else if (layout === LAYOUT.VERTICAL) {
                bar.attr({
                    x: function(d) { return xScale(d.name); },
                    y: 0,
                    width: function(d) { return xScale.rangeBand(); },
                    height: function(d) { return yScale(d.score); }
                }).style({
                    'fill': function(d) {
                        return 'url(#' + d.name.split(' ')[1].toLowerCase().replace(/'/, '') + ')';
                    }
                });

                circle.style({
                    'opacity': 0,
                    'pointer-events': 'none'
                });

                label.style({
                    'text-anchor' : 'middle',
                    'transform': 'translateX(0)' +
                                 'translateY(1.2em)'
                }).attr({
                    class : function(d) {
                        return 'label ' + (d.isFirst ? 'gold' : 'inverse');
                    },
                    x : function(d) { return xScale(d.name) + (xScale.rangeBand() / 2); },
                    y : function(d) { return yScale(d.score); }
                });

                name.attr({
                    x : function(d) { return xScale(d.name) + (xScale.rangeBand() * 0.5); },
                    y : function(d) { return yScale(d.score); }
                }).style({
                    'text-anchor': 'middle',
                    'transform': 'translateX(0)' +
                                 'translateY(2.4em)'
                });
            }

            // Common stuff (horizontal & vertical)
            label.text(function(d) {
                return String(d.score).replace(/\./, ',');
            });

            // Handle events
            var getOpacity = function(reference) {
                return function(d) { return reference.name === d.name ? 1 : 0.7; };
            };
        });
    };

    window.startBars = function(input, _side) {
        side = _side;
        // Refine results
        data = _.reduce(_.map(_.pluck(input, 'results'), function(row) {
            // We only want delegates count
            return _.mapValues(row, function(result) {
                return result.delegates;
            });
        }), function(a, b) {
            // Sum every round
            return _.mapValues(a, function(n, k) {
                return n + b[k];
            });
        });

        total = _.sum(data);

        while (total++ % 10 > 0); --total;

        data = _.map(data, function(v, k) {
            return {
                name : k,
                score : v,
                percent : (v * 100) / total
            };
        });

        data = _.sortByOrder(data, 'score', 'desc');
        data[0].isFirst = true;
        head = _.head(data);
        var tail = _.shuffle(_.tail(data));
        data = _.take(tail, Math.floor(tail.length / 2)).concat(head).concat(_.takeRight(tail, Math.ceil(tail.length / 2)));

        // Call on resize
        window.addEventListener('resize', _.debounce(drawBars, 200));
        // Initial call
        drawBars();

        // Draw lines
        window.startLines(input);

        // Draw rounds
        window.startRounds(input);

        drawBars();

        window.dispatchEvent(new Event('resize'));
    };
});
