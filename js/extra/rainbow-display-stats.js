$(function() {

    'use strict';

    var labels = {
        show: 'show usage counts',
        hide: 'hide usage counts'
    };

    /**
     * Rainbow.displayStats();
     *
     * Adds a new element before <pre> tag and displays usage counts.
     *
     * @param tag {String} optional - any element container of <pre> tag (applies to all <pre> tags if no param given)
     * @param fullList {Boolean} optional - if true will expand the list of usages
     */
    Rainbow.displayStatsOn = function(tag,fullList){

        Rainbow.statsOn = tag || 'body';
        Rainbow.statsFull = fullList;

        getElementLink();

    };

    /********************
     * PRIVATE METHODS
     ********************/

    function getElementLink(){
        var $link = $('<a>').attr('href','#').text(labels.show);

        $link.on('click',createOrToggleList);

        $(Rainbow.statsOn).find('pre').before($link);
    }

    function getElementStats($target){
        var classes = getClasses($target.next()),
            $stats = $('<div>').attr('class','rainbow-stats'),
            $class = $('<span>').attr('class','rainbow-stats-class'),
            $count = $('<span>').attr('class','rainbow-stats-count');

        for(var c in classes){
            if(classes.hasOwnProperty(c)){
                $stats.append(
                    $('<div>')
                        .append($count.clone().text(classes[c].count))
                        .append($class.clone().text(classes[c].name)
                            .on('click',doHighlight)
                        )
                );
            }
        }

        $target.after($stats);

        return $stats;
    }

    function getClasses($el){

        var classes = {};

        if(!$el || !$el.is || !$el.is('pre')) {
            return null;
        }

        $el.find('span').each(function(i,e){

            var clsStr = $(e).attr('class');

            classes[clsStr] || (classes[clsStr]=0);
            classes[clsStr]++;

            if(Rainbow.statsFull === true){
                var clsArr = clsStr.split(' ');
                for(var c in clsArr){
                    if(clsArr.hasOwnProperty(c)){
                        classes[clsArr[c]] || (classes[clsArr[c]]=0);
                        classes[clsArr[c]]++;
                    }
                }
            }

        });

        var classesArray = [];
        for(var cl in classes){
            if(classes.hasOwnProperty(cl)){
                classesArray.push({name:cl,count:classes[cl]});
            }
        }

        return classesArray.sort(function(a,b){return a.name > b.name;});

    }

    /********************
     * EVENT HANDLERS
     ********************/

    function createOrToggleList(e){
        e.preventDefault();

        var $t = $(e.currentTarget),
            $stats = $t.next('.rainbow-stats');

        var action = $stats.length===0 ? 'create' : $stats.css('display')==='none' ? 'show' : 'hide';

        switch(action){
            case 'create':
                $t.text(labels.hide);
                getElementStats($t);
                break;
            case 'show':
                $t.text(labels.hide);
                $stats.show();
                break;
            case 'hide':
                $t.text(labels.show);
                $stats.hide();
                break;
        }
    }

    function doHighlight(e){
        var $t = $(e.currentTarget),
            cl = $t.text().split(' ');

        $('.rainbow-stats-class').removeClass('rainbow-stats-selected');
        $t.addClass('rainbow-stats-selected');

        cl.unshift('');
        Rainbow.doHighlight && Rainbow.doHighlight($t.closest('.rainbow-stats').next(),cl.join('.'));
    }

});
