// Общие скрипты сайта: плавная прокрутка, окно «Связаться с нами», автозапуск видео, форма подписки.
// Подключается во всех страницах (js/site.js) вместо повторяющихся inline-скриптов.

// Настройки форм (окно «Связаться с нами» и подписка на «Новостях»).
// FORM_ENDPOINT + ACCESS_KEY — сервис форм Web3Forms (письма приходят на почту, указанную при получении ключа).
// Если оставить пустым — откроется почтовая программа с готовым письмом на MAIL_TO.
var ST_CONFIG = {
  FORM_ENDPOINT: "https://api.web3forms.com/submit",
  ACCESS_KEY: "d228ea12-bd6a-411d-be0a-6f8422f728af",
  MAIL_TO: "smarttehlogic@mail.ru",
};

const lenis = new Lenis({
  autoRaf: true,

  prevent: (node) => {
    return node.closest(".book-form-block");
  },
});

(function () {
  var FORM_ENDPOINT = ST_CONFIG.FORM_ENDPOINT,
    MAIL_TO = ST_CONFIG.MAIL_TO;

  var modal = document.getElementById("stContactModal");
  var form = document.getElementById("stContactForm");
  var formWrap = document.getElementById("stModalFormWrap");
  var success = document.getElementById("stFormSuccess");
  var successText = document.getElementById("stFormSuccessText");
  var errorBox = document.getElementById("stFormError");
  var submitBtn = form.querySelector(".st-modal__submit");
  var lastFocus = null;

  function lenisCall(fn) {
    try {
      if (typeof lenis !== "undefined") lenis[fn]();
    } catch (e) {}
  }

  function openModal() {
    lastFocus = document.activeElement;
    formWrap.hidden = false;
    success.hidden = true;
    errorBox.hidden = true;
    modal.hidden = false;
    document.documentElement.classList.add("st-modal-open");
    lenisCall("stop");
    requestAnimationFrame(function () {
      modal.classList.add("is-open");
      var first = form.querySelector('input[name="name"]');
      if (first) first.focus();
    });
  }

  function closeModal() {
    modal.classList.remove("is-open");
    document.documentElement.classList.remove("st-modal-open");
    lenisCall("start");
    setTimeout(function () {
      modal.hidden = true;
    }, 250);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener(
    "click",
    function (e) {
      var opener = e.target.closest("[data-open-contact]");
      if (opener) {
        e.preventDefault();
        e.stopPropagation();
        openModal();
        return;
      }
      if (e.target.closest("[data-st-close]") && !modal.hidden) closeModal();
    },
    true,
  );

  document.addEventListener("keydown", function (e) {
    if (modal.hidden) return;
    if (e.key === "Escape") {
      closeModal();
      return;
    }
    if (e.key === "Tab") {
      var items = modal.querySelectorAll(
        "button, input:not(.st-hp), textarea, a[href]",
      );
      items = Array.prototype.filter.call(items, function (el) {
        return el.offsetParent !== null;
      });
      if (!items.length) return;
      var first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }

  form.addEventListener("input", function (e) {
    if (e.target.classList) e.target.classList.remove("is-invalid");
    errorBox.hidden = true;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.elements.name,
      email = form.elements.email,
      message = form.elements.message;
    var bad = [];
    [name, email, message].forEach(function (f) {
      f.classList.remove("is-invalid");
    });
    if (!name.value.trim()) bad.push(name);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()))
      bad.push(email);
    if (!message.value.trim()) bad.push(message);
    if (bad.length) {
      bad.forEach(function (f) {
        f.classList.add("is-invalid");
      });
      showError("Пожалуйста, заполните все поля и проверьте адрес e-mail.");
      bad[0].focus();
      return;
    }
    if (form.elements.website.value) {
      // защита от ботов
      formWrap.hidden = true;
      success.hidden = false;
      return;
    }
    var data = {
      name: name.value.trim(),
      email: email.value.trim(),
      message: message.value.trim(),
      access_key: ST_CONFIG.ACCESS_KEY,
      subject: "Заявка с сайта СМАРТТЕХНОЛОГИЯ",
      from_name: "Сайт СМАРТТЕХНОЛОГИЯ",
    };

    if (!FORM_ENDPOINT) {
      var body =
        "Имя: " + data.name + "\nE-mail: " + data.email + "\n\n" + data.message;
      window.location.href =
        "mailto:" +
        MAIL_TO +
        "?subject=" +
        encodeURIComponent("Заявка с сайта СМАРТТЕХНОЛОГИЯ") +
        "&body=" +
        encodeURIComponent(body);
      successText.textContent =
        "Откроется ваша почтовая программа с готовым письмом. Отправьте его, чтобы мы получили заявку.";
      formWrap.hidden = true;
      success.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    var label = submitBtn.textContent;
    submitBtn.textContent = "Отправляем…";
    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok || j.success === false) throw new Error("bad status");
        });
      })
      .then(function () {
        form.reset();
        successText.textContent =
          "Мы получили вашу заявку и скоро свяжемся с вами.";
        formWrap.hidden = true;
        success.hidden = false;
      })
      .catch(function () {
        showError(
          "Не удалось отправить заявку. Попробуйте позже или напишите на " +
            MAIL_TO +
            ".",
        );
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = label;
      });
  });
})();

// Надёжный автозапуск фоновых видео (Hero и «Результаты»)
(function () {
  var vids = Array.prototype.slice.call(
    document.querySelectorAll(".w-background-video video"),
  );
  if (!vids.length) return;
  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function start(v) {
    if (reduce || v.dataset.userPaused) return;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  vids.forEach(function (v) {
    v.muted = true;
    if (v.readyState >= 2) start(v);
    else
      v.addEventListener(
        "loadeddata",
        function () {
          start(v);
        },
        { once: true },
      );
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting && v.paused) start(v);
          });
        },
        { threshold: 0.01 },
      ).observe(v);
    }
  });

  // если автозапуск заблокирован браузером — пробуем при первом действии посетителя
  ["click", "touchstart", "keydown", "scroll"].forEach(function (ev) {
    window.addEventListener(
      ev,
      function () {
        vids.forEach(function (v) {
          if (v.paused) start(v);
        });
      },
      { once: true, passive: true },
    );
  });

  // уважаем кнопку паузы/воспроизведения
  document.addEventListener(
    "click",
    function (e) {
      var btn = e.target.closest("[data-w-bg-video-control]");
      if (!btn) return;
      var v = document.getElementById(btn.getAttribute("aria-controls"));
      if (!v) return;
      setTimeout(function () {
        if (v.paused) v.dataset.userPaused = "1";
        else delete v.dataset.userPaused;
      }, 50);
    },
    true,
  );
})();

// Запасной вариант: если Webflow IX3 не запустился за 4 секунды, показываем контент без анимаций
setTimeout(function () {
  var h = document.documentElement;
  if (!h.classList.contains("w-mod-ix3")) h.classList.add("st-fallback");
}, 4000);

// Форма подписки на новости (использует те же ST_CONFIG).
(function () {
  var FORM_ENDPOINT = ST_CONFIG.FORM_ENDPOINT,
    MAIL_TO = ST_CONFIG.MAIL_TO;
  var form = document.getElementById("wf-form-Subscribe-Form");
  if (!form) return;
  var wrap = form.closest(".w-form");
  var ok = wrap && wrap.querySelector(".w-form-done");
  var fail = wrap && wrap.querySelector(".w-form-fail");
  form.addEventListener(
    "submit",
    function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var email = (document.getElementById("sub-email").value || "").trim();
      if (!email) return;
      if (!FORM_ENDPOINT) {
        window.location.href =
          "mailto:" +
          MAIL_TO +
          "?subject=" +
          encodeURIComponent("Подписка на новости") +
          "&body=" +
          encodeURIComponent("Прошу подписать на новости: " + email);
        return;
      }
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: ST_CONFIG.ACCESS_KEY,
          subject: "Подписка на новости",
          from_name: "Сайт СМАРТТЕХНОЛОГИЯ",
          email: email,
          message: "Прошу подписать на новости: " + email,
        }),
      })
        .then(function (r) {
          return r.json().then(function (j) {
            if (!r.ok || j.success === false) throw new Error("bad");
          });
        })
        .then(function () {
          form.reset();
          form.style.display = "none";
          if (ok) ok.style.display = "block";
          if (fail) fail.style.display = "none";
        })
        .catch(function () {
          if (fail) fail.style.display = "block";
        });
    },
    true,
  );
})();
