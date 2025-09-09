// Service Worker for 蜗牛自然拼读卡牌识别器
const CACHE_NAME = 'phonics-app-v1.0.0';
const AUDIO_CACHE_NAME = 'phonics-audio-v1.0.0';
const RUNTIME_CACHE_NAME = 'phonics-runtime-v1.0.0';

// 核心应用资源
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// 专业拼读音频文件 - 所有级别词汇（包含拼读教学过程）
// L1级别 (108个) - 基础CVC单词
const L1_AUDIO_FILES = [
  // word-a-cards (短a音)
  '/audio/bad.mp3', '/audio/bag.mp3', '/audio/bat.mp3', '/audio/can.mp3', '/audio/cap.mp3',
  '/audio/cat.mp3', '/audio/dad.mp3', '/audio/fan.mp3', '/audio/fat.mp3', '/audio/gap.mp3',
  '/audio/ham.mp3', '/audio/hat.mp3', '/audio/jab.mp3', '/audio/jam.mp3', '/audio/lab.mp3',
  '/audio/lad.mp3', '/audio/lap.mp3', '/audio/mad.mp3', '/audio/man.mp3', '/audio/map.mp3',
  '/audio/mat.mp3', '/audio/max.mp3', '/audio/nap.mp3', '/audio/pad.mp3', '/audio/pan.mp3',
  '/audio/pat.mp3', '/audio/rag.mp3', '/audio/rat.mp3', '/audio/sad.mp3', '/audio/sax.mp3',
  '/audio/tab.mp3', '/audio/tag.mp3', '/audio/tap.mp3', '/audio/van.mp3', '/audio/wax.mp3', '/audio/yam.mp3',

  // word-e-cards (短e音)
  '/audio/bed.mp3', '/audio/beg.mp3', '/audio/bet.mp3', '/audio/fed.mp3', '/audio/get.mp3',
  '/audio/hen.mp3', '/audio/jet.mp3', '/audio/leg.mp3', '/audio/let.mp3', '/audio/met.mp3',
  '/audio/net.mp3', '/audio/pen.mp3', '/audio/pet.mp3', '/audio/red.mp3', '/audio/set.mp3',
  '/audio/ten.mp3', '/audio/vet.mp3', '/audio/wet.mp3', '/audio/yet.mp3',

  // word-i-cards (短i音)
  '/audio/big.mp3', '/audio/bin.mp3', '/audio/bit.mp3', '/audio/did.mp3', '/audio/dig.mp3',
  '/audio/fig.mp3', '/audio/fin.mp3', '/audio/fit.mp3', '/audio/fix.mp3', '/audio/him.mp3',
  '/audio/hip.mp3', '/audio/hit.mp3', '/audio/jig.mp3', '/audio/kid.mp3', '/audio/kit.mp3',
  '/audio/lid.mp3', '/audio/lip.mp3', '/audio/mix.mp3', '/audio/nib.mp3', '/audio/pig.mp3',
  '/audio/pin.mp3', '/audio/rib.mp3', '/audio/rid.mp3', '/audio/rim.mp3', '/audio/sit.mp3',
  '/audio/six.mp3', '/audio/tin.mp3', '/audio/tip.mp3', '/audio/wig.mp3', '/audio/win.mp3',
  '/audio/wit.mp3', '/audio/zip.mp3',

  // word-o-cards (短o音)
  '/audio/box.mp3', '/audio/cop.mp3', '/audio/dog.mp3', '/audio/dot.mp3', '/audio/fox.mp3',
  '/audio/god.mp3', '/audio/got.mp3', '/audio/hop.mp3', '/audio/hot.mp3', '/audio/job.mp3',
  '/audio/jog.mp3', '/audio/log.mp3', '/audio/lot.mp3', '/audio/mom.mp3', '/audio/mop.mp3',
  '/audio/nod.mp3', '/audio/not.mp3', '/audio/pop.mp3', '/audio/pot.mp3', '/audio/rob.mp3',
  '/audio/rod.mp3', '/audio/top.mp3',

  // word-u-cards (短u音)
  '/audio/bug.mp3', '/audio/bun.mp3', '/audio/bus.mp3', '/audio/cup.mp3', '/audio/cut.mp3',
  '/audio/fun.mp3', '/audio/gun.mp3', '/audio/hug.mp3', '/audio/hut.mp3', '/audio/mud.mp3',
  '/audio/mug.mp3', '/audio/nut.mp3', '/audio/pug.mp3', '/audio/pup.mp3', '/audio/rub.mp3',
  '/audio/rug.mp3', '/audio/run.mp3', '/audio/sub.mp3', '/audio/sun.mp3', '/audio/tub.mp3', '/audio/tug.mp3'
];

// L2级别 (120个) - 长元音和双元音
const L2_AUDIO_FILES = [
  '/audio/bay.mp3', '/audio/beam.mp3', '/audio/bean.mp3', '/audio/beat.mp3', '/audio/bee.mp3',
  '/audio/bell.mp3', '/audio/boat.mp3', '/audio/boot.mp3', '/audio/boss.mp3', '/audio/bow.mp3',
  '/audio/bright.mp3', '/audio/buff.mp3', '/audio/buzz.mp3', '/audio/coal.mp3', '/audio/coat.mp3',
  '/audio/cow.mp3', '/audio/cuff.mp3', '/audio/day.mp3', '/audio/deal.mp3', '/audio/deed.mp3',
  '/audio/die.mp3', '/audio/doll.mp3', '/audio/eat.mp3', '/audio/fail.mp3', '/audio/feed.mp3',
  '/audio/fight.mp3', '/audio/fizz.mp3', '/audio/flight.mp3', '/audio/fluff.mp3', '/audio/foam.mp3',
  '/audio/fool.mp3', '/audio/full.mp3', '/audio/gay.mp3', '/audio/goat.mp3', '/audio/hail.mp3',
  '/audio/hay.mp3', '/audio/heap.mp3', '/audio/heat.mp3', '/audio/heel.mp3', '/audio/hie.mp3',
  '/audio/high.mp3', '/audio/hill.mp3', '/audio/hoop.mp3', '/audio/how.mp3', '/audio/huff.mp3',
  '/audio/jail.mp3', '/audio/jay.mp3', '/audio/jazz.mp3', '/audio/kay.mp3', '/audio/kiss.mp3',
  '/audio/lay.mp3', '/audio/lead.mp3', '/audio/lean.mp3', '/audio/lie.mp3', '/audio/light.mp3',
  '/audio/load.mp3', '/audio/loaf.mp3', '/audio/mail.mp3', '/audio/main.mp3', '/audio/may.mp3',
  '/audio/mean.mp3', '/audio/meat.mp3', '/audio/meet.mp3', '/audio/mess.mp3', '/audio/might.mp3',
  '/audio/miss.mp3', '/audio/moat.mp3', '/audio/moon.mp3', '/audio/nail.mp3', '/audio/nay.mp3',
  '/audio/neat.mp3', '/audio/need.mp3', '/audio/night.mp3', '/audio/now.mp3', '/audio/oak.mp3',
  '/audio/off.mp3', '/audio/owl.mp3', '/audio/pail.mp3', '/audio/pass.mp3', '/audio/pay.mp3',
  '/audio/pea.mp3', '/audio/peak.mp3', '/audio/peel.mp3', '/audio/pie.mp3', '/audio/pool.mp3',
  '/audio/puff.mp3', '/audio/pull.mp3', '/audio/quill.mp3', '/audio/rain.mp3', '/audio/ray.mp3',
  '/audio/razz.mp3', '/audio/read.mp3', '/audio/reed.mp3', '/audio/right.mp3', '/audio/road.mp3',
  '/audio/roam.mp3', '/audio/roll.mp3', '/audio/room.mp3', '/audio/root.mp3', '/audio/sail.mp3',
  '/audio/say.mp3', '/audio/sea.mp3', '/audio/seal.mp3', '/audio/see.mp3', '/audio/seed.mp3',
  '/audio/seem.mp3', '/audio/sell.mp3', '/audio/sight.mp3', '/audio/soap.mp3', '/audio/still.mp3',
  '/audio/tea.mp3', '/audio/team.mp3', '/audio/tie.mp3', '/audio/tight.mp3', '/audio/till.mp3',
  '/audio/toad.mp3', '/audio/tool.mp3', '/audio/vie.mp3', '/audio/wait.mp3', '/audio/way.mp3',
  '/audio/weed.mp3', '/audio/well.mp3', '/audio/will.mp3', '/audio/wow.mp3', '/audio/yell.mp3', '/audio/zoo.mp3'
];

// L3级别 (130个) - 复杂辅音群和多音节词
const L3_AUDIO_FILES = [
  '/audio/ash.mp3', '/audio/back.mp3', '/audio/beach.mp3', '/audio/black.mp3', '/audio/bleed.mp3',
  '/audio/bless.mp3', '/audio/block.mp3', '/audio/blood.mp3', '/audio/bloom.mp3', '/audio/blue.mp3',
  '/audio/blush.mp3', '/audio/brain.mp3', '/audio/brass.mp3', '/audio/break.mp3', '/audio/brick.mp3',
  '/audio/bright.mp3', '/audio/broom.mp3', '/audio/brown.mp3', '/audio/brush.mp3', '/audio/cash.mp3',
  '/audio/chain.mp3', '/audio/chat.mp3', '/audio/check.mp3', '/audio/chest.mp3', '/audio/chill.mp3',
  '/audio/chop.mp3', '/audio/clam.mp3', '/audio/clap.mp3', '/audio/clash.mp3', '/audio/class.mp3',
  '/audio/clay.mp3', '/audio/click.mp3', '/audio/clock.mp3', '/audio/cloth.mp3', '/audio/club.mp3',
  '/audio/clue.mp3', '/audio/crab.mp3', '/audio/crack.mp3', '/audio/crash.mp3', '/audio/cream.mp3',
  '/audio/creek.mp3', '/audio/creep.mp3', '/audio/crop.mp3', '/audio/cross.mp3', '/audio/crowd.mp3',
  '/audio/crush.mp3', '/audio/crust.mp3', '/audio/duck.mp3', '/audio/fish.mp3', '/audio/flag.mp3',
  '/audio/flash.mp3', '/audio/flat.mp3', '/audio/flee.mp3', '/audio/fleet.mp3', '/audio/flesh.mp3',
  '/audio/flex.mp3', '/audio/flight.mp3', '/audio/flock.mp3', '/audio/freak.mp3', '/audio/free.mp3',
  '/audio/fresh.mp3', '/audio/fright.mp3', '/audio/frock.mp3', '/audio/frog.mp3', '/audio/fruit.mp3',
  '/audio/grain.mp3', '/audio/grass.mp3', '/audio/great.mp3', '/audio/greed.mp3', '/audio/green.mp3',
  '/audio/greet.mp3', '/audio/grill.mp3', '/audio/grin.mp3', '/audio/grip.mp3', '/audio/lock.mp3',
  '/audio/luck.mp3', '/audio/neck.mp3', '/audio/pack.mp3', '/audio/pick.mp3', '/audio/plain.mp3',
  '/audio/plan.mp3', '/audio/play.mp3', '/audio/plot.mp3', '/audio/pluck.mp3', '/audio/plug.mp3',
  '/audio/plum.mp3', '/audio/plus.mp3', '/audio/push.mp3', '/audio/rock.mp3', '/audio/sheep.mp3',
  '/audio/shell.mp3', '/audio/ship.mp3', '/audio/shop.mp3', '/audio/slap.mp3', '/audio/sleep.mp3',
  '/audio/sleet.mp3', '/audio/slight.mp3', '/audio/slim.mp3', '/audio/slip.mp3', '/audio/slit.mp3',
  '/audio/slot.mp3', '/audio/slug.mp3', '/audio/smash.mp3', '/audio/smell.mp3', '/audio/smith.mp3',
  '/audio/smock.mp3', '/audio/smog.mp3', '/audio/smooth.mp3', '/audio/smug.mp3', '/audio/smut.mp3',
  '/audio/snail.mp3', '/audio/snap.mp3', '/audio/sneak.mp3', '/audio/sniff.mp3', '/audio/snip.mp3',
  '/audio/snob.mp3', '/audio/snoop.mp3', '/audio/snub.mp3', '/audio/snug.mp3', '/audio/sock.mp3',
  '/audio/swan.mp3', '/audio/swap.mp3', '/audio/sway.mp3', '/audio/sweat.mp3', '/audio/sweep.mp3',
  '/audio/sweet.mp3', '/audio/swell.mp3', '/audio/swim.mp3', '/audio/swish.mp3', '/audio/wish.mp3'
];

// 合并所有音频文件
const ALL_AUDIO_FILES = [...L1_AUDIO_FILES, ...L2_AUDIO_FILES, ...L3_AUDIO_FILES];

// 当前已有的音频文件（优先缓存）
const CORE_AUDIO_FILES = [
  '/audio/bat.mp3',
  '/audio/cat.mp3',
  '/audio/dad.mp3',
  '/audio/fat.mp3',
  '/audio/sad.mp3'
];

// 安装事件 - 缓存核心资源
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    Promise.all([
      // 缓存应用外壳
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL);
      }),
      
      // 预缓存核心音频文件
      caches.open(AUDIO_CACHE_NAME).then(cache => {
        console.log('[SW] Caching core audio files');
        // 只缓存存在的音频文件，避免404错误
        return Promise.allSettled(
          CORE_AUDIO_FILES.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
            }).catch(() => {
              console.log(`[SW] Audio file not found: ${url}`);
            })
          )
        );
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      // 强制激活新的Service Worker
      return self.skipWaiting();
    })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    Promise.all([
      // 清理旧版本缓存
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== AUDIO_CACHE_NAME && 
                cacheName !== RUNTIME_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // 立即控制所有客户端
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete');
    })
  );
});

// 网络请求拦截
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }
  
  // 音频文件请求处理
  if (request.url.includes('/audio/')) {
    event.respondWith(handleAudioRequest(request));
    return;
  }
  
  // 应用资源请求处理
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image') {
    event.respondWith(handleAppRequest(request));
    return;
  }
  
  // API请求处理
  if (request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
});

// 处理音频请求 - 缓存优先策略
async function handleAudioRequest(request) {
  try {
    // 1. 先检查音频缓存
    const audioCache = await caches.open(AUDIO_CACHE_NAME);
    const cachedResponse = await audioCache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Audio served from cache:', request.url);
      return cachedResponse;
    }
    
    // 2. 网络请求
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 缓存新的音频文件
      const responseClone = networkResponse.clone();
      audioCache.put(request, responseClone);
      console.log('[SW] Audio cached from network:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Audio request failed:', error);
    
    // 返回静默音频或错误响应
    return new Response('', {
      status: 404,
      statusText: 'Audio not available offline'
    });
  }
}

// 处理应用请求 - 缓存优先，网络回退
async function handleAppRequest(request) {
  try {
    // 1. 检查应用缓存
    const appCache = await caches.open(CACHE_NAME);
    const cachedResponse = await appCache.match(request);
    
    if (cachedResponse) {
      // 后台更新策略
      fetch(request).then(response => {
        if (response.ok) {
          appCache.put(request, response.clone());
        }
      }).catch(() => {});
      
      return cachedResponse;
    }
    
    // 2. 网络请求
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 缓存新资源
      const responseClone = networkResponse.clone();
      appCache.put(request, responseClone);
    }
    
    return networkResponse;
    
  } catch (error) {
    // 3. 离线时返回缓存的index.html
    if (request.destination === 'document') {
      const appCache = await caches.open(CACHE_NAME);
      return appCache.match('/index.html');
    }
    
    throw error;
  }
}

// 处理API请求 - 网络优先策略
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // 缓存成功的API响应
    if (networkResponse.ok) {
      const runtimeCache = await caches.open(RUNTIME_CACHE_NAME);
      runtimeCache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // 网络失败时返回缓存
    const runtimeCache = await caches.open(RUNTIME_CACHE_NAME);
    const cachedResponse = await runtimeCache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// 后台同步事件
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// 执行后台同步
async function doBackgroundSync() {
  try {
    // 同步离线时收集的学习数据
    const data = await getStoredSyncData();
    if (data.length > 0) {
      await syncLearningData(data);
      await clearStoredSyncData();
    }
  } catch (error) {
    console.log('[SW] Background sync failed:', error);
  }
}

// 获取存储的同步数据
async function getStoredSyncData() {
  // 这里可以从IndexedDB获取离线数据
  return [];
}

// 同步学习数据
async function syncLearningData(data) {
  // 发送到服务器
  return fetch('/api/sync-learning-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

// 清除已同步的数据
async function clearStoredSyncData() {
  // 清理IndexedDB中的数据
}

// 消息处理
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    });
  }
});

// 获取缓存状态
async function getCacheStatus() {
  const appCache = await caches.open(CACHE_NAME);
  const audioCache = await caches.open(AUDIO_CACHE_NAME);
  
  const appKeys = await appCache.keys();
  const audioKeys = await audioCache.keys();
  
  return {
    appCacheSize: appKeys.length,
    audioCacheSize: audioKeys.length,
    totalCacheSize: appKeys.length + audioKeys.length
  };
}
