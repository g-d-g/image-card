describe('image-card', function () {

  var elem, elem2;

  function customEvnt(elem, type, props) {
    var evnt = new Event(type),
        j;
    for ( j in (props || {}) ) {
      if ( hasOwnProperty.call(props, j) ) {
        evnt[j] = props[j];
      }
    }
    elem.dispatchEvent(evnt);
  }

  beforeEach(function () {
    var frag = xtag.createFragment('<image-card current="2">\
      <img src="images/kitten.jpg" alt="">\
      <img src="images/murray.jpg" alt="">\
      <img src="images/city.jpg" alt="">\
    </image-card>');
    var frag2 = xtag.createFragment('<image-card>\
      <img src="images/kitten.jpg" alt="">\
      <img src="images/murray.jpg" alt="">\
      <card-control></card-control>\
    </image-card>');
    elem = frag.childNodes[0];
    elem2 = frag2.childNodes[0];
    document.body.appendChild(elem);
    document.body.appendChild(elem2);
  });

  afterEach(function () {
    elem.remove();
    elem2.remove();
    bodyPointerUp = null;
    sliderX = null;
    clientLeft = null;
    clientWidth = null;
  });

  describe('basics', function () {

    it('should be defined', function () {
      expect(ImageCard).toBeDefined();
    });

    it('should have an ID', function () {
      expect(elem.__id).toContain('ic-');
    });

    it('should be a valid element', function () {
      expect(toString.call(elem)).toBe('[object HTMLElement]');
    });

    it('should have the correct tabindex', function () {
      expect(elem.tabIndex).toBe(0);
      expect(elem2.tabIndex).toBe(-1);
    });

    it('should have the inner elements', function () {
      expect(elem.querySelectorAll('.wrapper').length).toBe(1);
      expect(elem.querySelectorAll('.wrapper-inner').length).toBe(1);
      expect(elem.querySelectorAll('.slider').length).toBe(1);
    });

    it('should have the role- and aria-attributes', function () {
      expect(elem.getAttribute('role')).toBe('application');
      expect(elem.getAttribute('aria-multiselectable')).toBe('false');
    });

    it('should have card-control-attribute if card-control is inserted', function () {
      expect(elem.hasAttribute('data-card-control')).toBe(false);
      expect(elem2.hasAttribute('data-card-control')).toBe(true);
    });

  });

  describe('#images', function () {
    it('should store the contained images in the `images`-property', function () {
      expect(elem.images).toBeDefined();
      expect(elem.images.length).toBe(3);
      expect(elem.images[0].nodeName).toBe('IMG');
    });
    it('should be read-only', function () {
      elem.images = 'foo';
      expect(elem.images).not.toBe('foo');
    });
    it('should have correct aria-attributes', function () {
      expect(elem.images[0].getAttribute('aria-hidden')).toBe('true');
      expect(elem.images[1].getAttribute('aria-hidden')).toBe('false');
      expect(elem.images[2].getAttribute('aria-hidden')).toBe('true');
      expect(elem.images[0].hasAttribute('aria-labeledby')).toBe(false);
      expect(elem.images[1].hasAttribute('aria-labeledby')).toBe(false);
      expect(elem.images[2].hasAttribute('aria-labeledby')).toBe(false);
      expect(elem2.images[0].getAttribute('aria-labeledby')).toBe('btn-' + elem2.__id + '-1');
      expect(elem2.images[1].getAttribute('aria-labeledby')).toBe('btn-' + elem2.__id + '-2');
    });
    it('should have the role-attribute and ID', function () {
      expect(elem.images[0].getAttribute('role')).toBe('tabpanel');
      expect(elem.images[1].getAttribute('role')).toBe('tabpanel');
      expect(elem.images[2].getAttribute('role')).toBe('tabpanel');
      expect(elem.images[0].id).toBe('img-' + elem.__id + '-1');
      expect(elem.images[1].id).toBe('img-' + elem.__id + '-2');
      expect(elem.images[2].id).toBe('img-' + elem.__id + '-3');
    });
    it('should have the correct tabindex', function () {
      expect(elem.images[0].tabIndex).toBe(-1);
      expect(elem.images[1].tabIndex).toBe(-1);
      expect(elem.images[2].tabIndex).toBe(-1);
    });
  });

  describe('#current', function () {
    it('should have a fallback-default-value', function () {
      expect(document.createElement('image-card').current).toBe('1');
    });
    it('should be 2', function () {
      expect(elem.current).toBe('2');
    });
    it('should set new value', function () {
      elem.current = 1;
      expect(elem.current).toBe('1');
    });
    it('should fire a change-event', function () {
      var cur;
      elem.addEventListener('change', function (evnt) {
        cur = evnt.detail.current;
      }, false);
      elem.current = 3;
      expect(cur).toBe('3');
    });
  });

  describe('#prev', function () {
    it('should be defined', function () {
      expect(typeof elem.prev).toBe('function');
    });
    it('should decrease current value until first is reached', function () {
      elem.prev();
      expect(elem.current).toBe('1');
      elem.prev();
      expect(elem.current).toBe('1');
    });
    it('should trigger cycling', function () {
      spyOn(window, 'cycle');
      elem.prev();
      expect(cycle).toHaveBeenCalledWith(0, 1);
    });
    it('should have a fluent interface', function () {
      expect(elem.prev() instanceof ImageCard).toBe(true);
    });
    it('should reset the aria-hidden-attributes', function () {
      elem.prev();
      expect(elem.images[0].getAttribute('aria-hidden')).toBe('false');
      expect(elem.images[1].getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('#next', function () {
    it('should be defined', function () {
      expect(typeof elem.next).toBe('function');
    });
    it('should increase the current value until last is reached', function () {
      elem.next();
      expect(elem.current).toBe('3');
      elem.next();
      expect(elem.current).toBe('3');
    });
    it('should trigger cycling', function () {
      spyOn(window, 'cycle');
      elem.next();
      expect(cycle).toHaveBeenCalledWith(2, 1);
    });
    it('should have a fluent interface', function () {
      expect(elem.next() instanceof ImageCard).toBe(true);
    });
    it('should reset the aria-hidden-attributes', function () {
      elem.next();
      expect(elem.images[1].getAttribute('aria-hidden')).toBe('true');
      expect(elem.images[2].getAttribute('aria-hidden')).toBe('false');
    });
  });

  describe('dragging-support', function () {

    it('should bind and unbind mousemove-events', function () {
      expect(bodyPointerUp).toBe(null);
      expect(clientLeft).toBe(null);
      expect(clientWidth).toBe(null);
      xtag.fireEvent(elem, 'mousedown');
      expect(bodyPointerUp).not.toBe(null);
      expect(clientLeft).not.toBe(null);
      expect(clientWidth).not.toBe(null);
      xtag.fireEvent(document.body, 'mouseup');
      expect(bodyPointerUp).toBe(null);
      expect(clientLeft).toBe(null);
      expect(clientWidth).toBe(null);
    });

    it('should set and destroy the initial offset', function () {
      expect(initialOffsetX).toBe(null);
      customEvnt(elem, 'mousedown', {pageX: 10 + elem.getBoundingClientRect().left});
      expect(initialOffsetX).toBeDefined();
      expect(initialOffsetX).toBe(10);
      xtag.fireEvent(document.body, 'mouseup');
      expect(initialOffsetX).toBe(null);
    });

    it('should set and destroy the sliderX', function () {
      expect(sliderX).toBe(null);
      xtag.fireEvent(elem, 'mousedown');
      expect(sliderX).toBeDefined();
      xtag.fireEvent(document.body, 'mouseup');
      expect(sliderX).toBe(null);
    });

    it('should drag the images', function () {
      spyOn(window, 'onDragging').andCallThrough();
      customEvnt(elem, 'mousedown', {pageX: 10 + elem.getBoundingClientRect().left});
      expect(sliderX).not.toBe(null);
      customEvnt(elem, 'mousemove', {pageX: 20 + elem.getBoundingClientRect().left});
      expect(window.onDragging).toHaveBeenCalled();
      xtag.fireEvent(elem, 'mouseup');
      expect(sliderX).toBe(null);
    });

  });

});