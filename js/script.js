// Try to use vanilla javascript instead of jQuery when possible!
// Much love <3

window.addEventListener('load', function() {
    window.formatDate = (function() {
        var months = [
            'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre',
            'octobre', 'novembre', 'décembre'
        ];

        return function(str) {
            str = str.split('/');
            str[1] = months[parseInt(str[1]) - 1];
            return str.join(' ');
        };
    })();

    window.getScrollTop = function() {
        return (document.documentElement && document.documentElement.scrollTop)
            || document.body.scrollTop;
    };

    window.getInnerWidth = function(element, minus) {
        var styles = window.getComputedStyle(element);

        return element.getBoundingClientRect().width
            - (parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight))
            - (parseFloat(styles.borderLeftWidth) + parseFloat(styles.borderRightWidth))
            - minus;
    };
    window.getInnerHeight = function(element) {
        var styles = window.getComputedStyle(element);
        return element.getBoundingClientRect().height
            - (parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom))
            - (parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth));
    };

    var search = _.zipObject(_.map(window.location.search.replace(/^\?/, '').split('&'), function(datum) {
        return datum.split('=');
    }));

    // Check if we have a `dem` variable in the URL
    var side = _(window.location.search.replace(/^\?/, '').split('&')).map(function(datum) {
        return datum.split('=');
    }).zipObject().keys().run().indexOf('dem') >= 0 ? 'dem' : 'rep';

    document.querySelector('.container').classList.add(side);
    document.querySelector('.tt').classList.add(side);
    document.querySelector('h1 span').textContent = side === 'dem' ? 'Démocrates' : 'Républicaines';
    document.querySelector('.container__link span').textContent = side === 'dem' ? 'républicaines' : 'démocrates';

    document.querySelector('.container__link').addEventListener('click', function() {
        window.location.search = '?' + (side === 'dem' ? 'rep' : 'dem');
    });
    [].slice.call(document.querySelectorAll('.container img')).forEach(function(item, i) {
        item.setAttribute('src', side === 'dem' ? 'img/ane.png' : 'img/elephant.png');
    })

    d3.tsv('data-' + side + '.tsv', function(d) {
        var results = {};

        _.filter(_.keys(d), function(k) { return k.indexOf('%') === 0; }).forEach(function(k) {
            results[k.replace(/^% /, '')] = {
                percent : parseFloat(d[k].replace(/,/g, '.')),
                delegates : parseFloat(d[k.replace(/^% /, 'DLG ')])
            };
        });

        return {
            state : d['Etat / territoire'],
            rawDate : d['Date'],
            date : new Date(d['Date'].split('/').reverse().join('-')),
            type : d['Type de scrutin'],
            results : results,
            delegates : parseInt(d['Délégués impératifs']),
            red : d['Répartition'] === 'Préférence présidentielle'
        };
    }, function(data) {
        data = _.filter(data, function(d) { return !d.red; });

        // Draw bars
        window.startBars(data, side);
    });
});
