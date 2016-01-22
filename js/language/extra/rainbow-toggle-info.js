$(function() {

    'use strict';

    if(!Rainbow) {
        return;
    }

    /**
     * Rainbow.toggleInfoOn(tag:String, toggle:Boolean);
     *
     * Toggle mouseover/out events for display classes info on every Rainbow generated span tags.
     *
     * @param tag {String} any ancestor tag of the <pre> modified by Rainbow
     * @param toggle {Boolean} optional
     * @param keepOverlay {Boolean} optional - whether to keep the overlay on mouseOut or not
     * @returns {boolean} returns false if no tags were found
     */
    Rainbow.toggleInfoOn = function(tag, toggle, keepOverlay) {

        if($(tag).length===0) {
            return false;
        }

        typeof(toggle)!=='boolean' && (toggle = !$(tag).data('Rainbow.overlayInfoState'));

        if(!!toggle){
            $(tag).on('mouseover', 'pre span', showOverlay);
            keepOverlay || $(tag).on('mouseout', 'pre span', hideOverlay);
        }else{
            $(tag).off('mouseover', 'pre span', showOverlay);
            $(tag).off('mouseout', 'pre span', hideOverlay);
        }

        $(tag).data('Rainbow.overlayInfoState', !toggle);

        return true;
    };

    /**
     * Rainbow.setOverlayContent(classes:Array);
     *
     * Override this method in order to customize the overlay content
     *
     * @param classes {Array} list of classes to be displayed as info
     */
    Rainbow.setOverlayContent = function(classes){
        return ['<p>',classes.join(',^ ').split(',').join('</p><p>'),'</p>'].join('');
    };

    /**
     * Rainbow.setOverlayContainer($dom:jQuery);
     *
     * Call this method in order to customize the overlay main element
     *
     * @param $dom {jQuery} a jquery object that will be used as overlay info
     * @param ID {String} optional
     */
    Rainbow.setOverlayContainer = function($dom, ID){
        ID || (ID='rainbowOverlay');

        if(typeof($dom)==='object' && typeof(ID)==='string'){
            $dom.attr('id',ID);
            Rainbow.$overlayInfoContainer = $dom;
        }
    };

    // sets default className
    Rainbow.setOverlayContainer($('<div/>'), 'rainbowOverlay');

    /**
     * Rainbow.refreshOverlay();
     *
     * Publicly exposed method to let the overlay refresh upon new highlights.
     */
    Rainbow.refreshOverlay = function(){
        showOverlay({target:Rainbow.$overlayedEl});
    };

    /********************
     * PRIVATE METHODS
     ********************/

    function hideOverlay(){
        Rainbow.$overlayInfoContainer && Rainbow.$overlayInfoContainer.remove();
    }

    function showOverlay(e){
        e.stopPropagation && e.stopPropagation();

        hideOverlay();

        var $e = $(e.target),
            classes = getClasses($e);

        Rainbow.$overlayedEl = $e;

        if(classes){
            var html = Rainbow.setOverlayContent(classes),
                $overlay = Rainbow.$overlayInfoContainer;

            $overlay && $overlay.html(html).appendTo('body');
        }
    }

    function getClasses($e){

        var classes, $p;

        if($e.is('span')){
            classes = [getRainbowClasses($e)];

            $p = $e.parent();
            while($p.is('span')){
                classes.push(getRainbowClasses($p));
                $p = $p.parent();
            }

            return classes;
        }

        return null;
    }

    // removes the class defined in Rainbow.toggleHighlightClass from the returning classes string
    function getRainbowClasses($el){
        var classes = $el.attr('class');

        if(~classes.indexOf(Rainbow.toggleHighlightClass)){
            var classes_arr = classes.split(' '),
                idx = classes_arr.indexOf(Rainbow.toggleHighlightClass);

            if(idx>-1){
                classes_arr.splice(idx,1);
                classes = '<strong>'+classes_arr.join(' ')+'</strong>';
            }
        }

        return classes;
    }

});
