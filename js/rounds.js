// Try to use vanilla javascript instead of jQuery when possible!
// Much love <3

window.addEventListener('load', function() {
    var data, total;

    var drawRounds = function() {
        if (data == null || data.length <= 0) { return; }

        [].slice.call(document.querySelectorAll('.rounds-container')).forEach(function(container) {
            var containerWidth = window.getInnerWidth(container, 0) - 2;
            if (containerWidth <= 0) { return; }

            // Set up scale
            var scale = d3.scale.linear().domain([0, total]).range([0, containerWidth]);

            var round = d3.select(container).selectAll('.round').data(data, function(d) {
                return d.state;
            });

            // Remove old rounds
            round.exit().remove();
            // Add new rounds
            round.enter().append('div').attr('class', 'round');

            round.style({
                width : function(d) { return String(scale(d.delegates)) + 'px'; }
            }).attr({
                class : function(d) {
                    return 'round' + (d.done ? '' : ' faded');
                }
            });

            round.on('mouseenter', function(datum) {
                var tt = document.querySelector('.tt'),
                    text = datum.state + '<br>' +
                           formatDate(datum.rawDate) + '<br><br>';

                tt.classList.remove('hidden');

                if (datum.done) {
                    _.keys(datum.results).forEach(function(key) {
                        if (datum.results[key].delegates > 0) {
                            text += datum.results[key].name + ' ' + String(datum.results[key].percent).replace(/\./g, ',') + '% ' +
                                    String(datum.results[key].delegates) + ' délégués<br>';
                        }
                    });
                } else {
                    text += datum.type + '<br>' +
                            String(datum.delegates) + ' délégués à attribuer';
                }

                tt.querySelector('p').innerHTML = text;
            });

            round.on('mousemove', function() {
                var tt = document.querySelector('.tt'),
                    thisBoundingRect = this.getBoundingClientRect(),
                    thisHorizontalCenter = thisBoundingRect.left + (thisBoundingRect.width / 2),
                    left = Math.min(
                        window.innerWidth - tt.getBoundingClientRect().width,
                        Math.max(
                            0,
                            thisHorizontalCenter - (tt.getBoundingClientRect().width / 2)
                        )
                    );

                tt.style.left = String(left) + 'px';
                tt.style.top = String(13 + thisBoundingRect.top + thisBoundingRect.height + window.getScrollTop()) + 'px';

                tt.querySelector('.tt--arrow').style.left = String(thisHorizontalCenter - left) + 'px';
                tt.querySelector('.tt--arrow').style.opacity = 1;
            });

            round.on('mouseleave', function() {
                document.querySelector('.tt').classList.add('hidden');
            });
        });
    };

    window.startRounds = function(input) {
        data = _.map(_.sortBy(input, 'date'), function(row) {
            row.done = _.sum(_.mapValues(row.results, function(result) {
                result.name = arguments[1];
                return result.delegates;
            })) > 0;
            row.results = _.sortByOrder(row.results, 'percent', 'desc');
            return row;
        });
        total = _.sum(_.pluck(data, 'delegates'));
        totalAssigned = _.sum(_.pluck(_.filter(data, function(d) { return d.done; }), 'delegates'));

        totalStates = data.length;
        totalAssignedStates = _.filter(data, function(d) { return d.done; }).length;

        // Texts
        document.querySelector('.n1').textContent = String(total - totalAssigned);
        document.querySelector('.n2').textContent = String(_.round(((total - totalAssigned) * 100) / total));
        document.querySelector('.n3').textContent = String(totalStates - totalAssignedStates);
        document.querySelector('.n4').textContent = String(_.round(((totalStates - totalAssignedStates) * 100) / totalStates));

        // Call on resize
        window.addEventListener('resize', _.debounce(drawRounds, 200));
        // Initial call
        drawRounds();
    };
});
