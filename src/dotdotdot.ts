/*!
 *  dotdotdot JS 4.0.9
 *
 *  dotdotdot.frebsite.nl
 *
 *  Copyright (c) Fred Heusschen
 *  www.frebsite.nl
 *
 *  License: CC-BY-NC-4.0
 *  http://creativecommons.org/licenses/by-nc/4.0/
 *
 *  Contributors: Justin Leider <github@justinleider.com>
 */

export type dddContainer = HTMLElement & { dotdotdot?: dddFunctionObject };

/** An object with function values. */
export interface dddFunctionObject {
  [key: string]: Function
}

/** Default options for the class. */
export interface dddOptions {

  /** The ellipsis to place after the truncated text. */
  ellipsis?: string,

  /** Function to invoke after the truncate process. */
  callback?: Function,

  /** How to truncate: 'node', 'word' (default) or 'letter'. */
  truncate?: string,

  /** Optional tolerance for the container height. */
  tolerance?: number,

  /** Selector for elements not to remove from the DOM. */
  keep?: string,

  /** Whether and when to update the ellipsis: null, 'window' (default) or 'resize' */
  watch?: string,

  /** The height for the container. If null, the max-height will be read from the CSS properties. */
  height?: number
}

/**
 * Class for a multiline ellipsis.
 */
export default class Dotdotdot {
  /**  Plugin version. */
  static version: string = '4.0.9';

  /**  Default options. */
  static options: dddOptions = {
    ellipsis: '\u2026 ',
    callback: () => {
    },
    truncate: 'word',
    tolerance: 0,
    keep: undefined,
    watch: 'window',
    height: undefined
  };

  /** Element to truncate */
  container: dddContainer;

  /** Options. */
  options: dddOptions;

  /** The max-height for the element. */
  maxHeight: number;

  /** The ellipsis to use for truncating. */
  ellipsis: Text;

  /** The API */
  API: dddFunctionObject;

  /** Storage for the watch timeout, oddly it has a number type. */
  watchTimeout: number | undefined;

  /** Storage for the watch interval, oddly it has a number type. */
  watchInterval: number | undefined;

  /** Storage for the original style attribute. */
  originalStyle: string;

  /** Storage for the original HTML. */
  originalContent: Node[];

  /** Function to invoke on window resize. Needs to be stored so it can be removed later on. */
  resizeEvent: EventListener | undefined;

  /**
   * Truncate a multiline element with an ellipsis.
   *
   * @param {HTMLElement}   container            The element to truncate.
   * @param {object}       [options=Dotdotdot.options]    Options for the menu.
   */
  constructor(
    container: HTMLElement,
    options: dddOptions = Dotdotdot.options
  ) {
    this.container = container;
    this.options = options || {};

    //  Set the watch timeout and -interval;
    this.watchTimeout = undefined;
    this.watchInterval = undefined;

    //  Set the resize event handler.
    this.resizeEvent = undefined;

    //  Extend the specified options with the default options.
    this.options = Object.assign(Dotdotdot.options, this.options);

    //  If the element already is a dotdotdot instance.
    //    -> Destroy the previous instance.
    const oldAPI = this.container.dotdotdot;
    if (oldAPI) {
      oldAPI.destroy();
    }

    //  Create the API.
    this.API = {
      'truncate': this.truncate,
      'restore': this.restore,
      'destroy': this.destroy,
      'watch': this.watch,
      'unwatch': this.unwatch
    };

    //  Store the API.
    this.container.dotdotdot = this.API;

    //  Store the original style attribute;
    this.originalStyle = this.container.getAttribute('style') || '';

    //  Collect the original contents.
    this.originalContent = this._getOriginalContent();

    //  Create the ellipsis Text node.
    this.ellipsis = this.options.ellipsis ? document.createTextNode(this.options.ellipsis) : document.createTextNode("");

    //  Set CSS properties for the container.
    const computedStyle = window.getComputedStyle(this.container);
    if (computedStyle.wordWrap !== 'break-word') {
      this.container.style.wordWrap = 'break-word';
    }
    if (computedStyle.whiteSpace === 'pre') {
      this.container.style.whiteSpace = 'pre-wrap';
    } else if (computedStyle.whiteSpace === 'nowrap') {
      this.container.style.whiteSpace = 'normal';
    }

    //  Set the max-height for the container.
    this.options.height = (this.options.height === null) ? this._getMaxHeight() : this.options.height;
    this.maxHeight = this._getMaxHeight();

    //  Truncate the text.
    this.truncate();

    //  Set the watch.
    if (this.options.watch) {
      this.watch();
    }
  }

  /**
   *  Restore the container to a pre-init state.
   */
  restore() {
    //  Stop the watch.
    this.unwatch();

    //  Restore the original style.
    this.container.setAttribute('style', this.originalStyle);

    //  Restore the original classname.
    this.container.classList.remove('ddd-truncated');

    //  Restore the original contents.
    this.container.innerHTML = '';
    this.originalContent.forEach(element => {
      this.container.append(element);
    });
  }

  /**
   * Fully destroy the plugin.
   */
  destroy() {
    this.restore();
    this.container.dotdotdot = undefined;
  }

  /**
   * Start a watch for the truncate process.
   */
  watch() {
    //  Stop any previous watch.
    this.unwatch();

    /**  The previously measure sizes. */
    let oldSizes = {
      width: null,
      height: null
    };

    /**
     * Measure the sizes and start the truncate process.
     */
    const watchSizes = (
      element: HTMLElement | Window,
      width: 'clientWidth' | 'innerWidth',
      height: 'clientHeight' | 'innerHeight'
    ) => {
      //  Only if the container is visible.
      if (
        this.container.offsetWidth ||
        this.container.offsetHeight ||
        this.container.getClientRects().length
      ) {
        const newSizes = {
          width: (<any>element)[width],
          height: (<any>element)[height]
        };

        if (
          oldSizes.width != newSizes.width ||
          oldSizes.height != newSizes.height
        ) {
          this.truncate();
        }

        return newSizes;
      }
      return oldSizes;
    };

    //  Update onWindowResize.
    if (this.options.watch == 'window') {
      this.resizeEvent = evnt => {
        //  Debounce the resize event to prevent it from being called very often.
        if (this.watchTimeout) {
          clearTimeout(this.watchTimeout);
        }

        this.watchTimeout = setTimeout(() => {
          oldSizes = watchSizes(window, 'innerWidth', 'innerHeight');
        }, 100);
      };

      window.addEventListener('resize', this.resizeEvent);

      //  Update in an interval.
    } else {
      this.watchInterval = setInterval(() => {
        oldSizes = watchSizes(
          this.container,
          'clientWidth',
          'clientHeight'
        );
      }, 1000);
    }
  }

  /**
   * Stop the watch.
   */
  unwatch() {
    //  Stop the windowResize handler.
    if (this.resizeEvent) {
      window.removeEventListener('resize', this.resizeEvent);
      this.resizeEvent = undefined;
    }

    //  Stop the watch interval.
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
    }

    //  Stop the watch timeout.
    if (this.watchTimeout) {
      clearTimeout(this.watchTimeout);
    }
  }

  /**
   * Start the truncate process.
   */
  truncate() {
    let isTruncated = false;

    //  Fill the container with all the original content.
    this.container.innerHTML = '';
    this.originalContent.forEach(element => {
      this.container.append(element.cloneNode(true));
    });

    //  Get the max height.
    this.maxHeight = this._getMaxHeight();

    //  Truncate the text.
    if (!this._fits()) {
      isTruncated = true;
      this._truncateToNode(this.container);
    }

    //  Add a class to the container to indicate whether or not it is truncated.
    this.container.classList[isTruncated ? 'add' : 'remove'](
      'ddd-truncated'
    );

    //  Invoke the callback.
    if (this.options.callback !== undefined) {
      this.options.callback.call(this.container, isTruncated);
    }

    return isTruncated;
  }

  /**
   * Truncate an element by removing elements from the end.
   *
   * @param {HTMLElement} element The element to truncate.
   */
  _truncateToNode(element: HTMLElement | Text) {
    const _coms: Comment[] = [],
      _elms: (HTMLElement | Text)[] = [];

    //  Empty the element
    //    -> replace all contents with comments
    Dotdotdot.$.contents(element).forEach(element => {
      if (
        !Dotdotdot.isElement(element) ||
        !(element as HTMLElement).matches('.ddd-keep')
      ) {
        let comment = document.createComment('');
        (element as HTMLElement).replaceWith(comment);

        _elms.push(element);
        _coms.push(comment);
      }
    });

    if (!_elms.length) {
      return;
    }

    //  Re-fill the element
    //    -> replace comments with contents until it doesn't fit anymore.
    for (var e = 0; e < _elms.length; e++) {
      _coms[e].replaceWith(_elms[e]);

      let ellipsis = this.ellipsis.cloneNode(true);
      let el = _elms[e];

      if (Dotdotdot.isElement(el)) {
        el.append(ellipsis);
      } else if (Dotdotdot.isText(el)) {
        el.after(ellipsis);
      }

      let fits = this._fits();
      if (ellipsis.parentElement) {
        ellipsis.parentElement.removeChild(ellipsis);
      }

      if (!fits) {
        if (this.options.truncate == 'node' && e > 1) {
          _elms[e - 2].remove();
          return;
        }
        break;
      }
    }

    //  Remove left over comments.
    for (var c = e; c < _coms.length; c++) {
      _coms[c].remove();
    }

    //  Get last element
    //    -> the element that overflows.

    var _last = _elms[Math.max(0, Math.min(e, _elms.length - 1))];

    //  Border case
    //    -> the last node with only an ellipsis in it...
    if (Dotdotdot.isElement(_last)) {
      let element = document.createElement(_last.nodeName);
      element.append(this.ellipsis);

      _last.replaceWith(element);

      //  ... fits
      //    -> Restore the full last element.
      if (this._fits()) {
        element.replaceWith(_last);

        //  ... doesn't fit
        //    -> remove it and go back one element.
      } else {
        element.remove();
        _last = _elms[Math.max(0, e - 1)];
      }
    }

    //  Proceed inside last element.
    if (Dotdotdot.isElement(_last)) {
      this._truncateToNode(_last);
    } else {
      this._truncateToWord(_last);
    }
  }

  /**
   * Truncate a sentence by removing words from the end.
   *
   * @param {HTMLElement} element The element to truncate.
   */
  _truncateToWord(element: HTMLElement | Text) {
    const text = element.textContent,
      separator = text ? text.indexOf(' ') !== -1 ? ' ' : '\u3000' : ' ',
      words = text ? text.split(separator) : [];

    for (var a = words.length; a >= 0; a--) {
      element.textContent = this._addEllipsis(
        words.slice(0, a).join(separator)
      );

      if (this._fits()) {
        if (this.options.truncate == 'letter') {
          element.textContent = words.slice(0, a + 1).join(separator);
          this._truncateToLetter(element);
        }
        break;
      }
    }
  }

  /**
   * Truncate a word by removing letters from the end.
   *
   * @param   {HTMLElement} element The element to truncate.
   */
  _truncateToLetter(element: HTMLElement | Text) {
    const letters = element.textContent ? element.textContent.split('') : [];
    let text = '';

    for (let a = letters.length; a >= 0; a--) {
      text = letters.slice(0, a).join('');

      if (!text.length) {
        continue;
      }

      element.textContent = this._addEllipsis(text);

      if (this._fits()) {
        break;
      }
    }
  }

  /**
   * Test if the content fits in the container.
   *
   * @return {boolean} Whether or not the content fits in the container.
   */
  _fits(): boolean {
    return (
      this.container.scrollHeight <=
      this.maxHeight + (this.options.tolerance || 0)
    );
  }

  /**
   * Add the ellipsis to a text.
   *
   * @param   {string} text   The text to add the ellipsis to.
   * @return  {string}    The text with the added ellipsis.
   */
  _addEllipsis(text: string): string {
    const remove = [' ', '\u3000', ',', ';', '.', '!', '?'];

    while (remove.indexOf(text.slice(-1)) > -1) {
      text = text.slice(0, -1);
    }
    text += this.ellipsis.textContent;

    return text;
  }

  /**
   * Sanitize and collect the original contents.
   *
   * @return {array} The sanitizes HTML elements.
   */
  _getOriginalContent(): (HTMLElement | Text)[] {
    let keep = 'script, style';
    if (this.options.keep) {
      keep += ', ' + this.options.keep;
    }

    //  Add "keep" class to nodes to keep.
    Dotdotdot.$.find(keep, this.container).forEach(elem => {
      elem.classList.add('ddd-keep');
    });

    [this.container, ...Dotdotdot.$.find('*', this.container)].forEach(
      element => {
        //  Removes empty Text nodes and joins adjacent Text nodes.
        element.normalize();

        //  Loop over all contents and remove nodes that can be removed.
        Dotdotdot.$.contents(element).forEach(text => {
          let remove = false;

          //  Remove Text nodes that do not take up space in the DOM.
          //  This kinda asumes a default display property for the elements in the container.
          if (Dotdotdot.isText(text)) {
            if ((text.textContent || '').trim() == '') {
              let prev = text.previousSibling as HTMLElement,
                next = text.nextSibling as HTMLElement;

              if (text.parentElement &&
                text.parentElement.matches(
                  'table, thead, tbody, tfoot, tr, dl, ul, ol, video'
                ) ||
                !prev ||
                prev.matches(
                  'div, p, table, td, td, dt, dd, li'
                ) ||
                !next ||
                next.matches(
                  'div, p, table, td, td, dt, dd, li'
                )
              ) {
                remove = true;
              }
            }

            //  Remove Comment nodes.
          } else if (Dotdotdot.isComment(text)) {
            remove = true;
          }

          if (remove) {
            element.removeChild(text);
          }
        });
      }
    );

    //  Create a clone of all contents.
    let content: (HTMLElement | Text)[] = [];
    Dotdotdot.$.contents(this.container).forEach(element => {
      content.push(<HTMLElement | Text>element.cloneNode(true));
    });

    return content;
  }

  /**
   * Find the max-height for the container.
   *
   * @return {number} The max-height for the container.
   */
  _getMaxHeight(): number {
    if (typeof this.options.height == 'number') {
      return this.options.height;
    }

    const style = window.getComputedStyle(this.container);

    //  Find smallest CSS height
    var properties: (keyof CSSStyleDeclaration)[] = ['maxHeight', 'height'],
      height = 0;

    for (var a = 0; a < properties.length; a++) {
      let property = style[properties[a]];
      if (property.slice(-2) == 'px') {
        height = parseFloat(property);
        break;
      }
    }

    //  Remove padding-top/bottom when needed.
    properties = [];
    switch (style.boxSizing) {
      case 'border-box':
        properties.push('borderTopWidth');
        properties.push('borderBottomWidth');
      //  no break -> padding needs to be added too

      case 'padding-box':
        properties.push('paddingTop');
        properties.push('paddingBottom');
        break;
    }
    for (var a = 0; a < properties.length; a++) {
      let property = style[properties[a]];
      if (property.slice(-2) == 'px') {
        height -= parseFloat(property);
      }
    }

    //  Sanitize
    return Math.max(height, 0);
  }

  static isElement(n: Node): n is Element {
    return n.nodeType === 1;
  }

  static isText(n: Node): n is Text {
    return n.nodeType === 3;
  }

  static isComment(n: Node): n is Comment {
    return n.nodeType === 8;
  }

  /** DOM traversing functions to uniform datatypes. */
  static $ = {
    /**
     * Find elements by a query selector in an element.
     *
     * @param {string}    selector       The selector to search for.
     * @param {HTMLElement}  [element=document]  The element to search in.
     * @return {array}               The found elements.
     */
    find: (
      selector: string,
      element?: HTMLElement | Document
    ): HTMLElement[] => {
      element = element || document;
      return Array.prototype.slice.call(
        element.querySelectorAll(selector)
      );
    },

    /**
     * Collect child nodes (HTML elements and TextNodes) in an element.
     *
     * @param {HTMLElement}  [element=document]  The element to search in.
     * @return {array}               The found nodes.
     */
    contents: (element?: HTMLElement | Text | Document): (Text | HTMLElement)[] => {
      element = element || document;
      return [].slice.call(element.childNodes);
    }
  };
}
