/* Korea front extension for the shared Fronts campaign engine. */
(function () {
  "use strict";

  var KOREA_FACTIONS = ["northkorea", "southkorea", "china", "usa", "ussr"];
  var KOREA_RED = ["northkorea", "china", "ussr"];
  var KOREA_BLUE = ["southkorea", "usa"];
  var KOREA_COLORS = {
    northkorea: "#c92835",
    southkorea: "#2d69b2",
    china: "#b93b32",
    usa: "#4a80b8",
    ussr: "#b82d31"
  };
  var KOREA_LABELS = {
    northkorea: "Kuzey Kore",
    southkorea: "Güney Kore",
    china: "Çin",
    usa: "Amerika Birleşik Devletleri",
    ussr: "SSCB"
  };
  var koreaMapTemplate = null;
  var koreaMapPromise = fetch("./korea-map.svg")
    .then(function (response) {
      if (!response.ok) throw new Error("Kore haritası yüklenemedi (" + response.status + ").");
      return response.text();
    })
    .then(function (text) {
      var parsed = new DOMParser().parseFromString(text, "image/svg+xml");
      var svg = parsed.documentElement;
      if (!svg || svg.tagName.toLowerCase() !== "svg" || parsed.querySelector("parsererror")) {
        throw new Error("Kore haritası geçerli bir SVG değil.");
      }
      svg.setAttribute("id", "korea-map");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "Kore Savaşı cephesi haritası");
      koreaMapTemplate = svg.cloneNode(true);
      return koreaMapTemplate;
    })
    .catch(function (error) {
      console.warn("Kore Cephesi haritası yüklenemedi:", error);
      return null;
    });

  function koreaTeam(faction) {
    if (KOREA_RED.indexOf(faction) !== -1) return "red";
    if (KOREA_BLUE.indexOf(faction) !== -1) return "blue";
    return null;
  }

  function koreaFriendly(faction, playerFaction) {
    return !!koreaTeam(faction) && koreaTeam(faction) === koreaTeam(playerFaction);
  }

  function koreaObjectiveFor(faction) {
    return koreaTeam(faction) === "red" ? "southkorea" : "northkorea";
  }

  function koreaAlliesOwn(ids, team) {
    return !!ids.length && ids.every(function (id) {
      var territory = nodeById[id];
      return territory && koreaTeam(territory.owner) === team;
    });
  }

  COLORS.northkorea = KOREA_COLORS.northkorea;
  COLORS.southkorea = KOREA_COLORS.southkorea;
  COLORS.china = KOREA_COLORS.china;
  COLORS.usa = KOREA_COLORS.usa;
  COLORS.ussr = KOREA_COLORS.ussr;
  LABELS.northkorea = KOREA_LABELS.northkorea;
  LABELS.southkorea = KOREA_LABELS.southkorea;
  LABELS.china = KOREA_LABELS.china;
  LABELS.usa = KOREA_LABELS.usa;
  LABELS.ussr = KOREA_LABELS.ussr;

  /* Use the supplied flags for Korea; keep old fronts self-contained too. */
  FLAGS.northkorea = "./north-korea.webp";
  FLAGS.southkorea = "./south-korea.png";
  FLAGS.china = "./china.png";
  FLAGS.usa = "./usa.png";
  FLAGS.ussr = "./ussr.png";
  FLAGS.uk = flagSvg("uk");
  FLAGS.germany = flagSvg("germany");
  setSelectionFlags();

  function aircraftSvg(fill, accent) {
    var art = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path fill="' + fill + '" stroke="' + accent + '" stroke-width="3" d="M48 4h5l5 19 31 13v7L58 39l-2 14-7 4-5-4-2-14-31 4v-7l31-13z"/><path fill="' + accent + '" d="M47 10h7v9h-7zm-3 35h13l-6 9z"/></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(art);
  }

  AIRCRAFT_IMAGES.northkorea = aircraftSvg("#c92835", "#fff");
  AIRCRAFT_IMAGES.southkorea = aircraftSvg("#2d69b2", "#fff");
  AIRCRAFT_IMAGES.china = aircraftSvg("#b93b32", "#ffe451");
  AIRCRAFT_IMAGES.usa = aircraftSvg("#315d9a", "#fff");
  AIRCRAFT_IMAGES.ussr = aircraftSvg("#bd2026", "#ffdf4d");
  AIRCRAFT_BADGES.northkorea = "NK";
  AIRCRAFT_BADGES.southkorea = "SK";
  AIRCRAFT_BADGES.china = "CN";
  AIRCRAFT_BADGES.usa = "US";
  AIRCRAFT_BADGES.ussr = "SU";
  ["italy", "germany", "hungary", "uk"].forEach(function (faction) {
    AIRCRAFT_IMAGES[faction] = aircraftSvg(COLORS[faction] || "#596d7a", "#fff");
  });

  var originalSetFrontRulesForKorea = setFrontRules;
  setFrontRules = function () {
    if (frontMode !== "korea") return originalSetFrontRulesForKorea();
    ALLIES = {
      northkorea: true,
      china: true,
      ussr: true,
      southkorea: true,
      usa: true
    };
  };

  var originalIsHostileForKorea = isHostile;
  isHostile = function (a, b) {
    if (frontMode !== "korea") return originalIsHostileForKorea(a, b);
    if (!a || !b || a === b) return false;
    var aTeam = koreaTeam(a);
    var bTeam = koreaTeam(b);
    return !aTeam || !bTeam || aTeam !== bTeam;
  };

  var originalEconomicFactionsForKorea = economicFactions;
  economicFactions = function () {
    return frontMode === "korea" ? KOREA_FACTIONS.slice() : originalEconomicFactionsForKorea();
  };

  var originalMapOwnerForKorea = mapOwnerForGroup;
  mapOwnerForGroup = function (groupId) {
    if (frontMode === "korea") {
      return {
        "North-Korea": "northkorea",
        "South-Korea": "southkorea",
        China: "china",
        Japan: "usa",
        Russia: "ussr"
      }[groupId] || null;
    }
    return originalMapOwnerForKorea(groupId);
  };

  var originalInitialTroopsForKorea = initialTroops;
  initialTroops = function (owner, num) {
    if (frontMode === "korea") {
      if (owner === "northkorea") return 7 + num % 5;
      if (owner === "southkorea") return 6 + num % 4;
      if (owner === "china") return 5 + num % 5;
      if (owner === "usa") return 8 + num % 5;
      if (owner === "ussr") return 5 + num % 4;
    }
    return originalInitialTroopsForKorea(owner, num);
  };

  var originalAssignNeighborsForKorea = assignNeighbors;
  assignNeighbors = function () {
    if (frontMode !== "korea") return originalAssignNeighborsForKorea();
    nodes.forEach(function (territory) { territory.neighbors.clear(); });
    var indexes = Object.create(null);
    nodes.forEach(function (territory) {
      indexes[territory.id] = buildSegmentIndex(pathSegments(territory.el));
    });
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i], aBox = a.box;
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j], bBox = b.box;
        if (aBox.x > bBox.x + bBox.width + 5 ||
            bBox.x > aBox.x + aBox.width + 5 ||
            aBox.y > bBox.y + bBox.height + 5 ||
            bBox.y > aBox.y + aBox.height + 5) continue;
        if (sharesLandBorder(indexes[a.id], indexes[b.id])) {
          a.neighbors.add(b.id);
          b.neighbors.add(a.id);
        }
      }
    }

    /* Ferry and expedition links let each playable side reach the front. */
    var seaRoutes = [
      ["province-85", "province-89"], ["province-86", "province-89"],
      ["province-87", "province-89"], ["province-88", "province-89"],
      ["province-90", "province-89"], ["province-91", "province-89"],
      ["province-92", "province-89"], ["province-93", "province-89"],
      ["province-94", "province-89"], ["province-95", "province-89"],
      ["province-89", "province-58"], ["province-89", "province-82"],
      ["province-20", "province-63"], ["province-21", "province-67"],
      ["province-26", "province-71"],
      ["province-96", "province-59"], ["province-97", "province-60"],
      ["province-98", "province-59"], ["province-99", "province-62"]
    ];
    seaRoutes.forEach(function (route) {
      var from = nodeById[route[0]], to = nodeById[route[1]];
      if (!from || !to) return;
      from.neighbors.add(to.id);
      to.neighbors.add(from.id);
    });
  };

  var originalUpdateMapLegendForKorea = updateMapLegend;
  updateMapLegend = function () {
    if (frontMode !== "korea") return originalUpdateMapLegendForKorea();
    var list = $("map-legend");
    list.replaceChildren();
    KOREA_FACTIONS.forEach(function (faction) {
      var item = document.createElement("span");
      var dot = document.createElement("i");
      dot.className = "legend-dot";
      dot.style.background = COLORS[faction];
      item.append(dot, document.createTextNode(countryText(faction)));
      list.appendChild(item);
    });
  };

  var originalLoadMapForKorea = loadMapForFront;
  loadMapForFront = function () {
    if (frontMode !== "korea") return originalLoadMapForKorea();
    if (!koreaMapTemplate) throw new Error("Kore haritası henüz yüklenmedi.");
    mapWrap.replaceChildren(koreaMapTemplate.cloneNode(true));
    mapSvg = mapWrap.querySelector("svg");
  };

  var originalChooseFrontForKorea = chooseFront;
  chooseFront = function (key) {
    originalChooseFrontForKorea(key);
    if (key !== "korea") return;
    $("country-eyebrow").textContent = "Kore Cephesi / 02";
    $("country-description").textContent =
      "Kuzey Kore, Güney Kore, Çin, ABD veya SSCB'yi seç. Diğer dört taraf yapay zekâ tarafından yönetilir.";
    $("alliance-note").textContent =
      "Kuzey Kore, Çin ve SSCB müttefiktir. Güney Kore ve ABD müttefiktir. Japonya'daki bütün başlangıç bölgeleri 1950'deki Amerikan işgali nedeniyle ABD kontrolündedir.";
    updateMapLegend();
  };

  $("open-korea").addEventListener("click", function () { chooseFront("korea"); });

  MISSION_OPTIONS.korea = {
    northkorea: [{
      id: "korea_red_offensive",
      title: "Güney Kore'yi ele geçir ve 3 tur tut",
      description: "Güney Kore'nin başlangıç bölgelerinin tamamını al ve üç tamamlanmış tur boyunca kontrol et."
    }],
    china: [{
      id: "korea_red_offensive",
      title: "Güney Kore'yi ele geçir ve 3 tur tut",
      description: "Kuzey Kore ittifakına destek ver; Güney Kore'nin başlangıç bölgelerinin tamamını al ve üç tur tut."
    }],
    ussr: [{
      id: "korea_red_offensive",
      title: "Güney Kore'yi ele geçir ve 3 tur tut",
      description: "Kuzey Kore ittifakına destek ver; Güney Kore'nin başlangıç bölgelerinin tamamını al ve üç tur tut."
    }],
    southkorea: [{
      id: "korea_blue_offensive",
      title: "Kuzey Kore'yi ele geçir ve 3 tur tut",
      description: "ABD ile ittifakını koru; Kuzey Kore'nin başlangıç bölgelerinin tamamını al ve üç tur tut."
    }],
    usa: [{
      id: "korea_blue_offensive",
      title: "Kuzey Kore'yi ele geçir ve 3 tur tut",
      description: "Güney Kore'yi destekle; Japonya'daki ABD üslerini kullanarak Kuzey Kore'nin tüm bölgelerini al ve üç tur tut."
    }]
  };

  var originalSetPlayerForKorea = setPlayer;
  setPlayer = function (key) {
    originalSetPlayerForKorea(key);
    if (frontMode !== "korea" || player !== key) return;
    if (koreaTeam(key) === "red") {
      $("country-goal-title").textContent = "Hedef: Güney Kore'yi ele geçir";
      $("country-goal-copy").textContent =
        "Kuzey Kore, Çin ve SSCB aynı ittifaktadır. Güney Kore'nin bütün başlangıç bölgelerini alıp üç tur boyunca tut. Japonya'daki ABD bölgeleri karşı ittifaka aittir.";
    } else {
      $("country-goal-title").textContent = "Hedef: Kuzey Kore'yi ele geçir";
      $("country-goal-copy").textContent =
        "Güney Kore ve ABD müttefiktir. Kuzey Kore'nin bütün başlangıç bölgelerini alıp üç tur boyunca tut. Japonya'daki bölgeler ABD kontrolünde başlar.";
    }
  };

  var originalPlayerIsObjectiveAttackerForKorea = playerIsObjectiveAttacker;
  playerIsObjectiveAttacker = function () {
    if (frontMode === "korea") return !!koreaTeam(player);
    return originalPlayerIsObjectiveAttackerForKorea();
  };

  var originalInitializeBoardForKorea = initializeBoard;
  initializeBoard = function () {
    originalInitializeBoardForKorea();
    if (frontMode !== "korea" || !nodes.length) return;
    var targetOwner = koreaObjectiveFor(player);
    objectiveIds = nodes.filter(function (territory) {
      return territory.owner === targetOwner;
    }).map(function (territory) { return territory.id; });
    koreaEnemyObjectiveIds = nodes.filter(function (territory) {
      return territory.owner === (targetOwner === "southkorea" ? "northkorea" : "southkorea");
    }).map(function (territory) { return territory.id; });
    $("map-status").textContent = nodes.length + " bölge · " + objectiveIds.length +
      " " + countryText(targetOwner) + " hedef toprağı";
    addLog("Kore haritası hazır. " + nodes.length + " bölge ve tüm kara/deniz bağlantıları komutada.");
    render();
  };
  var koreaEnemyObjectiveIds = [];
  var koreaEnemyHoldTurns = 0;

  var originalBeginGameForKorea = beginGame;
  function launchKoreaGame() {
    koreaEnemyHoldTurns = 0;
    originalBeginGameForKorea();
    $("campaign-name").textContent = "Kore Cephesi";
    $("campaign-era").textContent = "1950 · Kore Savaşı";
    $("mission-title").textContent = koreaTeam(player) === "red"
      ? "Güney Kore'yi 3 tur kontrol et"
      : "Kuzey Kore'yi 3 tur kontrol et";
    $("mission-copy").textContent = koreaTeam(player) === "red"
      ? "Güney Kore'nin başlangıç bölgelerinin tamamını ele geçir ve üç tamamlanmış tur boyunca kontrol et. Çin ve SSCB müttefiktir."
      : "Kuzey Kore'nin başlangıç bölgelerinin tamamını ele geçir ve üç tamamlanmış tur boyunca kontrol et. Güney Kore ile ABD müttefiktir.";
    $("progress-label").textContent = "İşgal hedefi";
    $("action-hint").textContent = "Haritada müttefik bölgeleri de destekleyebilirsin. Bölgeler en fazla 15 asker tutar.";
  }
  beginGame = function () {
    if (frontMode !== "korea") return originalBeginGameForKorea();
    if (koreaMapTemplate) return launchKoreaGame();
    notify("Kore haritası yükleniyor; oyun hazır olunca başlayacak.");
    return koreaMapPromise.then(function (svg) {
      if (!svg) {
        notify("Kore haritası yüklenemedi. Oyunu aynı klasörde bir web sunucusuyla aç.");
        return;
      }
      launchKoreaGame();
    });
  };

  var originalObjectiveFullyCapturedForKorea = objectiveFullyCaptured;
  objectiveFullyCaptured = function () {
    if (frontMode !== "korea") return originalObjectiveFullyCapturedForKorea();
    return koreaAlliesOwn(objectiveIds, koreaTeam(player));
  };

  var originalUpdateMissionForKorea = updateMission;
  updateMission = function () {
    if (frontMode !== "korea") return originalUpdateMissionForKorea();
    var value = $("progress-value"), fill = $("progress-fill");
    value.textContent = holdTurns + " / 3 tur";
    fill.style.width = Math.min(100, holdTurns / 3 * 100) + "%";
  };

  var originalUpdateMissionDisplayForKorea = updateMissionDisplay;
  updateMissionDisplay = function () {
    if (frontMode !== "korea") return originalUpdateMissionDisplayForKorea();
    if (!activeMission) return;
    $("mission-title").textContent = activeMission.title;
    $("mission-copy").textContent = activeMission.description;
    $("progress-label").textContent = "Hedefin elde tutulması";
    $("progress-value").textContent = holdTurns + " / 3 tur";
    $("progress-fill").style.width = Math.min(100, holdTurns / 3 * 100) + "%";
  };

  var originalIsMissionCompleteForKorea = isMissionComplete;
  isMissionComplete = function () {
    if (frontMode === "korea") return false;
    return originalIsMissionCompleteForKorea();
  };

  var originalShowVictoryForKorea = showVictory;
  showVictory = function (win) {
    if (frontMode !== "korea") return originalShowVictoryForKorea(win);
    $("victory-title").textContent = win ? "Kore Cephesi kazanıldı" : "Kore Cephesi kaybedildi";
    $("victory-copy").textContent = win
      ? "Hedef ülkenin bütün başlangıç bölgelerini ele geçirdin ve üç tamamlanmış tur boyunca kontrol ettin."
      : "Karşı ittifak senin hedef bölgelerinin tamamını ele geçirip üç tur boyunca elinde tuttu.";
    $("victory-overlay").hidden = false;
    addLog(win ? "Kore harekâtı kazanıldı." : "Kore harekâtı kaybedildi.");
  };

  var originalRenderMarkersForKorea = renderMarkers;
  renderMarkers = function () {
    originalRenderMarkersForKorea();
    if (frontMode !== "korea") return;
    nodes.forEach(function (territory) {
      var isValid = !!(mode && actionSource &&
        actionSource.neighbors.has(territory.id) &&
        territory.id !== actionSource.id &&
        ((mode === "move" && koreaFriendly(territory.owner, player)) ||
         (mode === "attack" && isHostile(actionSource.owner, territory.owner))));
      territory.el.classList.toggle("valid-target", isValid);
    });
  };

  var originalRenderForKorea = render;
  render = function () {
    originalRenderForKorea();
    if (frontMode !== "korea" || !initialized) return;
    var list = $("faction-list");
    list.replaceChildren();
    var counts = factionCounts();
    KOREA_FACTIONS.forEach(function (faction) {
      var row = document.createElement("div");
      var name = document.createElement("div");
      var dot = document.createElement("i");
      var label = document.createElement("span");
      var qty = document.createElement("div");
      var troops = nodes.filter(function (territory) {
        return territory.owner === faction;
      }).reduce(function (sum, territory) { return sum + territory.troops; }, 0);
      row.className = "faction-row";
      name.className = "faction-name";
      dot.style.background = COLORS[faction];
      label.textContent = countryText(faction) + (faction === player ? " · SEN" : "");
      name.append(dot, label);
      qty.className = "faction-count";
      qty.innerHTML = "<b>" + (counts[faction] || 0) + "</b> bölge · " +
        troops + " asker · " + (coins[faction] || 0) + " coin · +" + incomeFor(faction) + "/tur";
      row.append(name, qty);
      list.appendChild(row);
    });
    if (selected && koreaFriendly(selected.owner, player)) {
      $("selected-sub").textContent = countryText(selected.owner) +
        (selected.owner === player ? " · Senin bölgen" : " · Müttefik bölgesi");
    }
    $("alliance-note").textContent =
      "Kuzey Kore, Çin ve SSCB müttefiktir. Güney Kore ile ABD müttefiktir. Müttefik bölgelerden asker toplayabilir, hareket edebilir ve saldırı emri verebilirsin.";
  };

  var originalSetModeForKorea = setMode;
  setMode = function (next) {
    if (frontMode !== "korea") return originalSetModeForKorea(next);
    if (busy) return;
    if (next === "recruit" && (!player || (coins[player] || 0) < 2)) {
      notify("Takviye için en az 2 coin gerekir.");
      return;
    }
    if ((next === "move" || next === "attack") && selected &&
        hasQueuedAttackFrom(selected.id) && attackableTroops(selected) < 1) {
      notify("Bu bölgedeki kullanılabilir askerlerin tamamı zaten planlandı.");
      return;
    }
    if ((next === "move" || next === "recruit") && selected &&
        hasQueuedAttackFrom(selected.id)) selected = null;
    mode = next;
    actionSource = selected && koreaFriendly(selected.owner, player) ? selected : null;
    attackTarget = null;
    if (next === "recruit") {
      actionSource = null;
      var input = $("troop-range");
      input.max = Math.max(1, Math.min(15, Math.floor((coins[player] || 0) / 2)));
      input.value = "1";
      $("range-label").textContent = "Eklenecek asker · 2 coin/birim";
      $("range-value").textContent = input.value;
      $("range-wrap").hidden = false;
      $("action-hint").textContent = "Asker sayısını ayarla; kendi ya da müttefik bölgesine takviye gönder.";
    } else if (actionSource) {
      if ((acted[actionSource.id] && !freshUnits[actionSource.id]) || actionSource.troops < 1) {
        mode = null;
        actionSource = null;
        $("range-wrap").hidden = true;
        notify("Bu bölgede bu tur kullanabileceğin asker kalmadı.");
      } else {
        $("range-label").textContent = next === "attack" ? "Saldıracak asker" : "Gönderilecek asker";
        $("action-hint").textContent = next === "move"
          ? "Komşu bir kendi ya da müttefik bölgesine tıkla."
          : "Komşu düşman bölgesini seç; saldırı okunu sıraya ekleyip uygula.";
        configureRange();
      }
    } else {
      $("range-label").textContent = "Gönderilecek asker";
      $("action-hint").textContent = "Önce kendi ya da müttefik bölgeni seç.";
      $("range-wrap").hidden = true;
    }
    render();
    updateAttackOrderUI();
  };

  function selectKoreaSource(territory) {
    if (!koreaFriendly(territory.owner, player)) {
      notify("Kaynak, kendi ya da müttefik bölgen olmalı.");
      return;
    }
    selected = territory;
    actionSource = null;
    attackTarget = null;
    if ((acted[territory.id] && !freshUnits[territory.id]) || territory.troops < 1) {
      $("action-hint").textContent = territory.troops < 1
        ? "Bu bölgede asker yok; önce takviye ekle."
        : "Bu bölge bu tur emrini kullandı.";
      $("range-wrap").hidden = true;
      render();
      return;
    }
    actionSource = territory;
    if (mode === "attack" && attackableTroops(territory) < 1) {
      actionSource = null;
      $("action-hint").textContent = "Bu bölgedeki kullanılabilir askerlerin tamamı zaten planlandı.";
      $("range-wrap").hidden = true;
    } else {
      configureRange();
      $("range-label").textContent = mode === "attack" ? "Saldıracak asker" : "Gönderilecek asker";
      $("action-hint").textContent = mode === "attack"
        ? "Saldırılacak komşu düşman bölgesini seç."
        : "Birlikleri komşu kendi veya müttefik bölgesine taşı.";
    }
    render();
  }

  var originalOnTerritoryForKorea = onTerritory;
  onTerritory = function (territory) {
    if (frontMode !== "korea") return originalOnTerritoryForKorea(territory);
    if (!initialized || busy || !territory) return;

    if (mode === "nuclear-base" || mode === "nuclear-target") {
      return originalOnTerritoryForKorea(territory);
    }

    if (mode === "aircraft") {
      if (!koreaFriendly(territory.owner, player)) {
        notify("Uçaklar kendi ya da müttefik toprağına yerleştirilebilir.");
        return;
      }
      var requestedAircraft = Number($("troop-range").value) || 1;
      var addedAircraft = Math.min(requestedAircraft, 15 - (territory.aircraft || 0));
      if (addedAircraft < 1) {
        notify("Bu bölge zaten 15 uçakla dolu.");
        return;
      }
      territory.aircraft = (territory.aircraft || 0) + addedAircraft;
      territory.aircraftView = true;
      selected = territory;
      mode = null;
      actionSource = null;
      aircraftBase = null;
      $("range-wrap").hidden = true;
      $("action-hint").textContent = "Uçaklar yerleştirildi. Uçaklı bölgeye çift tıkla, sonra hedef seç.";
      addLog(countryText(territory.owner) + " Bölge " + territory.num +
        " bölgesine " + addedAircraft + " uçak yerleştirdi.");
      render();
      notify("Bölge " + territory.num + " · +" + addedAircraft + " uçak.");
      return;
    }

    if (aircraftBase) {
      return fireAircraftBomb(territory);
    }
    if (territory.aircraftView && territory.aircraft > 0 &&
        koreaFriendly(territory.owner, player)) {
      aircraftBase = territory;
      selected = territory;
      mode = null;
      actionSource = null;
      render();
      notify("Bölge " + territory.num + " hava menzili açık. Menzil içindeki düşman toprağını seç.");
      return;
    }

    if (mode === "recruit") {
      if (!koreaFriendly(territory.owner, player)) {
        notify("Takviye kendi ya da müttefik bölgesine alınabilir.");
        return;
      }
      if (recruited[territory.id]) {
        notify("Bu bölge bu tur zaten takviye aldı.");
        return;
      }
      var maxTroops = typeof troopLimitForTerritory === "function"
        ? troopLimitForTerritory(territory) : 15;
      var beforeTroops = territory.troops;
      var alreadyActed = !!acted[territory.id];
      var requested = Number($("troop-range").value) || 1;
      var add = Math.min(requested, maxTroops - beforeTroops,
        Math.floor((coins[player] || 0) / 2));
      if (add < 1) {
        notify(beforeTroops >= maxTroops ? "Bu bölge asker kapasitesine ulaştı." : "Yeterli coin yok.");
        return;
      }
      territory.troops += add;
      coins[player] -= add * 2;
      recruited[territory.id] = true;
      acted[territory.id] = true;
      if (alreadyActed) {
        freshUnits[territory.id] = (Number(freshUnits[territory.id]) || 0) + add;
      }
      selected = territory;
      mode = null;
      actionSource = null;
      $("range-wrap").hidden = true;
      $("action-hint").textContent = "Takviye yerleştirildi; yeni birlikler sonraki emirlerde kullanılabilir.";
      addLog(countryText(player) + ", Bölge " + territory.num + " bölgesine " +
        add + " asker aldı (" + add * 2 + " coin).");
      render();
      notify("Bölge " + territory.num + " · +" + add + " asker.");
      return;
    }

    if (mode === "move" || mode === "attack") {
      if (!actionSource) {
        selectKoreaSource(territory);
        return;
      }
      if (territory.id === actionSource.id) {
        selected = territory;
        actionSource = null;
        attackTarget = null;
        $("range-wrap").hidden = true;
        $("action-hint").textContent = "Kaynak seçimi iptal edildi.";
        render();
        return;
      }
      var destinationIsFriendly = koreaFriendly(territory.owner, player);
      if (mode === "attack" && destinationIsFriendly) {
        selectKoreaSource(territory);
        return;
      }
      if (!actionSource.neighbors.has(territory.id)) {
        notify("Hedef bu bölgeye komşu değil.");
        return;
      }
      if (mode === "move" && !destinationIsFriendly) {
        notify("Müttefik bölgeye saldıramazsın; oraya birlik taşı.");
        return;
      }
      if (mode === "attack" && !isHostile(actionSource.owner, territory.owner)) {
        notify("Müttefik bölgeye saldıramazsın; oraya birlik taşı.");
        return;
      }
      if (mode === "move") {
        var moveSource = actionSource;
        var destinationLimit = typeof troopLimitForTerritory === "function"
          ? troopLimitForTerritory(territory) : 15;
        var moveLimit = Math.min(availableTroopsForOrder(moveSource),
          moveSource.troops - 1, destinationLimit - territory.troops);
        var moveCount = Math.min(Number($("troop-range").value) || 1, moveLimit);
        if (moveCount < 1) {
          notify("Bu hareket için kullanılabilir asker ya da kapasite yok.");
          return;
        }
        moveSource.troops -= moveCount;
        territory.troops += moveCount;
        acted[moveSource.id] = true;
        acted[territory.id] = true;
        freshUnits[moveSource.id] = 0;
        selected = territory;
        actionSource = null;
        $("range-wrap").hidden = true;
        $("action-hint").textContent = "Birlikler komşu müttefik bölgeye taşındı.";
        addLog(countryText(player) + " birlikleri Bölge " + moveSource.num +
          " → Bölge " + territory.num + " yönüne " + moveCount + " asker taşıdı.");
        render();
        notify("Bölge " + territory.num + " · +" + moveCount + " asker.");
        return;
      }
      attackTarget = territory;
      selected = actionSource;
      configureRange(territory);
      $("range-label").textContent = "Saldıracak asker";
      $("action-hint").textContent = "Hedef: Bölge " + territory.num +
        ". Asker sayısını ayarla ve OK · Saldırı oku ekle'ye bas.";
      render();
      return;
    }

    if (mode) return originalOnTerritoryForKorea(territory);
    if (koreaFriendly(territory.owner, player)) {
      selected = territory;
      actionSource = null;
      $("action-hint").textContent = territory.owner === player
        ? "Bölge seçildi. Emir seçerek birliklerini yönet."
        : "Müttefik bölge seçildi. Burada asker toplayabilir ve emir verebilirsin.";
      render();
      return;
    }
    return originalOnTerritoryForKorea(territory);
  };

  var originalExecuteAttackOrdersForKorea = executeAttackOrders;
  executeAttackOrders = function () {
    if (frontMode !== "korea") return originalExecuteAttackOrdersForKorea();
    if (busy || !attackOrders.length) return;
    var orders = attackOrders.slice();
    var done = 0, cancelled = 0, budgets = Object.create(null);
    attackOrders = [];
    attackTarget = null;
    actionSource = null;
    mode = null;
    orders.forEach(function (order) {
      var from = nodeById[order.fromId], to = nodeById[order.toId];
      if (!from || !to || !koreaFriendly(from.owner, player) ||
          !from.neighbors.has(to.id) || !isHostile(from.owner, to.owner)) {
        cancelled++;
        return;
      }
      if (budgets[from.id] === undefined) budgets[from.id] = availableTroopsForOrder(from);
      var troops = Math.min(order.troops, budgets[from.id], from.troops);
      if (troops < 1) {
        cancelled++;
        return;
      }
      budgets[from.id] -= troops;
      freshUnits[from.id] = 0;
      resolveBattle(from, to, troops, player);
      done++;
    });
    $("range-wrap").hidden = true;
    if (done) addLog(done + " planlanan saldırı uygulandı." +
      (cancelled ? " " + cancelled + " geçersiz emir iptal edildi." : ""));
    render();
    notify(done + " saldırı uygulandı." +
      (cancelled ? " " + cancelled + " emir iptal edildi." : ""));
  };

  var originalToggleAircraftViewForKorea = toggleAircraftView;
  toggleAircraftView = function (territory) {
    if (frontMode !== "korea" || !territory || !koreaFriendly(territory.owner, player)) {
      return originalToggleAircraftViewForKorea(territory);
    }
    if (!(territory.aircraft > 0)) return onTerritory(territory);
    territory.aircraftView = !territory.aircraftView;
    selected = territory;
    mode = null;
    actionSource = null;
    aircraftBase = null;
    $("range-wrap").hidden = true;
    $("action-hint").textContent = territory.aircraftView
      ? "Uçaklar gösteriliyor. Tekrar tıkla ve düşman hedefini seç."
      : "Asker gösterimi açık.";
    render();
    notify(territory.aircraftView
      ? "Bölge " + territory.num + " · " + territory.aircraft + " uçak."
      : "Bölge " + territory.num + " · " + territory.troops + " asker.");
  };

  var originalBotGroundTargetScoreForKorea = botGroundTargetScore;
  botGroundTargetScore = function (faction, target, attackers) {
    var score = originalBotGroundTargetScoreForKorea(faction, target, attackers);
    if (frontMode !== "korea") return score;
    var objectiveOwner = koreaObjectiveFor(faction);
    if (target.owner === objectiveOwner) score += 95;
    if (target.owner === player) score += 14;
    if (target.troops === 0) score += 10;
    return score;
  };

  var originalBotAirTargetScoreForKorea = botAirTargetScore;
  botAirTargetScore = function (faction, target) {
    var score = originalBotAirTargetScoreForKorea(faction, target);
    if (frontMode === "korea" && target.owner === koreaObjectiveFor(faction)) score += 80;
    return score;
  };

  var originalEndTurnForKorea = endTurn;
  endTurn = function () {
    if (frontMode !== "korea") return originalEndTurnForKorea();
    if (busy) return;
    if (attackOrders.length) {
      notify("Önce planlanan saldırıları uygula ya da emirleri sil.");
      return;
    }
    if (nuclearState && ["target", "base", "confirm"].indexOf(nuclearState.phase) !== -1) {
      notify("Önce nükleer hedef seçimini tamamla veya iptal et.");
      return;
    }
    busy = true;
    $("end-turn").disabled = true;
    mode = null;
    actionSource = null;
    aircraftBase = null;
    $("action-hint").textContent = "Botlar Kore Cephesi'nde hamle yapıyor…";
    $("turn-chip").textContent = "TUR " + turn + " · BOTLAR OYNUYOR";
    render();
    setTimeout(function () {
      KOREA_FACTIONS.forEach(function (faction) {
        if (faction !== player) botTurn(faction);
      });
      holdTurns = objectiveFullyCaptured() ? holdTurns + 1 : 0;
      koreaEnemyHoldTurns = koreaAlliesOwn(koreaEnemyObjectiveIds,
        koreaTeam(player) === "red" ? "blue" : "red") ? koreaEnemyHoldTurns + 1 : 0;
      if (holdTurns >= 3 || koreaEnemyHoldTurns >= 3) {
        busy = false;
        render();
        showVictory(holdTurns >= 3);
        return;
      }
      collectIncome();
      turn++;
      acted = {};
      freshUnits = {};
      recruited = {};
      busy = false;
      selected = null;
      $("action-hint").textContent = "Yeni tur başladı. Kendi ve müttefik bölgelerinden emir ver.";
      $("turn-chip").textContent = "TUR " + turn + " · SENİN SIRAN";
      addLog("Yeni tur başladı. Takviyeler yenilendi; bölgeler yeniden emir alabilir.");
      render();
      $("end-turn").disabled = false;
    }, 450);
  };

  var originalReturnToMainMenuForKorea = returnToMainMenu;
  returnToMainMenu = function () {
    koreaEnemyHoldTurns = 0;
    koreaEnemyObjectiveIds = [];
    return originalReturnToMainMenuForKorea();
  };
})();
