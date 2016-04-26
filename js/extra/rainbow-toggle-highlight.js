$(function() {

    'use strict';

    /**
     * Rainbow.toggleHighlightOn(tag:String, toggle:Boolean);
     *
     * Toggle click event for highlight every Rainbow generated span tags.
     *
     * @param tag {String} any ancestor tag of the <pre> modified by Rainbow
     * @param toggle {Boolean} optional
     * @returns {Boolean} returns false if no tags were found
     */
    Rainbow.toggleHighlightOn = function(tag, toggle){

        if($(tag).length===0) {
            return false;
        }

        typeof(toggle)!=='boolean' && (toggle = !$(tag).data('Rainbow.toggleHighlightState'));

        if(!!toggle){
            $(tag).on('click', 'pre', highlightClasses);
        }else{
            $(tag).off('click', 'pre', highlightClasses);
        }

        $(tag).data('Rainbow.toggleHighlightState', !toggle);

        return true;
    };

    /**
     * Rainbow.doHighlight($parent:jQuery, selector:String);
     *
     * Publicly exposed method for a single highlight.
     *
     * @param $parent {jQuery} the element that contains the <pre> tag
     * @param selector {String} the selector to be highlighted
     */
    Rainbow.doHighlight = function($parent,selector){
        removeHighlight($parent);
        addHighlight($parent,selector);
    };

    /**
     * Rainbow.setHighlightClass(className:String);
     *
     * Call this method in order to customize the className for highlighted elements
     *
     * @param className {String} className for highlighted tags
     */
    Rainbow.setHighlightClass = function(className){
        if(typeof(className)==='string') {
            Rainbow.toggleHighlightClass = className;
        }
    };

    // sets default className
    Rainbow.setHighlightClass('highlighted');

    /********************
     * PRIVATE METHODS
     ********************/

    function highlightClasses(e){
        e.stopPropagation();

        if(!Rainbow.toggleHighlightClass || typeof(Rainbow.toggleHighlightClass)!=='string' || Rainbow.toggleHighlightClass.length===0){
            return;
        }

        var $e = $(e.target),
            $pre = $e.is('pre') ? $e : $e.closest('pre');

        if(!$e.is('span')) {
            removeHighlight($pre);
            return;
        }

        if($e.parents('.' + Rainbow.toggleHighlightClass).length){
            $e = $e.parents('.' + Rainbow.toggleHighlightClass).parents('span');
        }else if($e.hasClass(Rainbow.toggleHighlightClass)){
            $e = $e.parents('span');
        }

        removeHighlight($pre);

        if($e.length){
            var cl = $e.attr('class').split(' '),
                classes = [''];

            for(var c in cl){
                if(cl.hasOwnProperty(c)){
                    classes.push(cl[c]);
                }
            }

            addHighlight($pre,classes.join('.'));

            console.log('highlight on: ',classes.join('.'));
        }else {
            console.log('highlight off');
        }

        Rainbow.refreshOverlay && Rainbow.refreshOverlay();
    }

    function addHighlight($parent,selector){
        $parent.find(selector).addClass(Rainbow.toggleHighlightClass);
    }

    function removeHighlight($parent){
        $parent.find('.'+Rainbow.toggleHighlightClass).removeClass(Rainbow.toggleHighlightClass);
    }

});
