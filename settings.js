DRIB = {
      page: 1 //set the initial page numver
      //height based on viewport, for lazy loading
      //(99.95% of the window)
    , shotHeight: "" //will be set on intial load and after changing the grid size
    , panelHeight: null//for mobile, saving the height for re-rendering, the keyboard changes the viewport
    , deviceWidthLimit: 767//dont accept viewports pass this width
    , shotList: localStorage.getItem('DRIB-setting-shotlist') || 'everyone' //debuts, everyone, popular
    , shotImage: localStorage.getItem('DRIB-setting-shotImage') || "image_teaser_url"//hi res (image_url)
    , shotGrid: parseInt( localStorage.getItem('DRIB-setting-shotGrid') ) || 1 //options are 1, 2 and 3
    , shotCache: []//cache of the fetched shots
    , collections: {}
    , views: {}
    , collectionViews: {}
    , helper: _.extend({}, Backbone.Events)
}


// Compatibility override - Backbone 1.1 got rid of the 'options' binding
// automatically to views in the constructor - we need to keep that.
Backbone.View = (function(View) {
   return View.extend({
        constructor: function(options) {
            this.options = options || {};
            View.apply(this, arguments);
        }
    });
})(Backbone.View);

//override the underscore templates
_.templateSettings = {
  evaluate    : /\{\{([\s\S]+?)\}\}/g,
  interpolate : /\{\{=([\s\S]+?)\}\}/g,
  escape      : /\{\{-([\s\S]+?)\}\}/g
};