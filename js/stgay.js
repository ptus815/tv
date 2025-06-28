let ext = {};

function init(extend) {
    console.log("初始化配置: " + extend);
    if (typeof extend === 'object') {
        ext = extend;
    } else if (typeof extend === 'string' && extend) {
        try {
            ext = JSON.parse(extend);
        } catch (e) {
            console.error("解析扩展配置失败: ", e);
        }
    }
    console.log("模板初始化完毕.");
}

async function home(filter) {
    console.log("获取首页数据...");
    const url = "https://stgay.com/视频/当前最热";
    try {
        const html = await req(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Referer': 'https://stgay.com',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
            }
        });
        await new Promise(resolve => setTimeout(resolve, 30000));
        const $ = cheerio.load(html);
        // 动态提取分类
        let classes = [];
        // 从导航栏提取
        $('.dx-line-tabs.dx-tabs .dx-line-tab-item a').each((i, elem) => {
            const type_name = $(elem).text().trim();
            const href = $(elem).attr('href') || '';
            const type_id = href.match(/\/视频\/([^/]+)/)?.[1] || type_name;
            if (type_name && type_id) {
                classes.push({ type_id: decodeURIComponent(type_id), type_name, type: 'standard' });
            }
        });
        // 从新 HTML 的标题提取
        $('.flex.items-center.sticky').each((i, elem) => {
            const type_name = $(elem).find('h2').text().trim();
            const href = $(elem).find('a').attr('href') || '';
            let type_id, type;
            if (href.includes('/视频/search/')) {
                type_id = href.match(/\/视频\/search\/([^/]+)/)?.[1] || type_name;
                type = 'search';
            } else {
                type_id = href.match(/\/视频\/([^/]+)/)?.[1] || type_name;
                type = 'standard';
            }
            if (type_name && type_id) {
                classes.push({ type_id: decodeURIComponent(type_id), type_name, type });
            }
        });
        // 去重
        classes = [...new Map(classes.map(c => [c.type_id, c])).values()];
        let list = [];
        $('.video-items .video-item').each((i, elem) => {
            const title = $(elem).find('a.line-clamp-1').text().trim();
            const duration = $(elem).find('div.text-sm.opacity-50').text().trim();
            const link = $(elem).find('a.line-clamp-1').attr('href') || '';
            const img = $(elem).find('img').attr('data-src') || $(elem).find('img').attr('src') || '';
            if (link && title && !link.includes('ha69gx75ax.com')) {
                const vod_id = link.match(/\/视频\/[^/]+\/([^/]+)/)?.[1] || i;
                list.push({
                    vod_id: vod_id,
                    vod_name: title || '未知',
                    vod_pic: img.includes('blob:') ? '' : img,
                    vod_remarks: duration || '未知'
                });
            }
        });
        return JSON.stringify({ class: classes, list: list });
    } catch (e) {
        console.error("获取首页数据失败: ", e);
        return JSON.stringify({ class: [], list: [] });
    }
}

async function category(a, pg, filter, extend) {
    console.log(`获取分类数据: 分类ID=${a}, 页码=${pg}`);
    // 根据 ext.type 选择 URL 格式
    const type = ext.classes?.find(c => c.type_id === a)?.type || 'standard';
    const url = type === 'search' 
        ? `https://stgay.com/视频/search/${encodeURIComponent(a)}/${pg}`
        : `https://stgay.com/视频/${encodeURIComponent(a)}/${pg}`;
    try {
        const html = await req(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Referer': 'https://stgay.com',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
            }
        });
        await new Promise(resolve => setTimeout(resolve, 30000));
        const $ = cheerio.load(html);
        let list = [];
        $('.video-items .video-item').each((i, elem) => {
            const title = $(elem).find('a.line-clamp-1').text().trim();
            const duration = $(elem).find('div.text-sm.opacity-50').text().trim();
            const link = $(elem).find('a.line-clamp-1').attr('href') || '';
            const img = $(elem).find('img').attr('data-src') || $(elem).find('img').attr('src') || '';
            if (link && title && !link.includes('ha69gx75ax.com')) {
                const vod_id = link.match(/\/视频\/[^/]+\/([^/]+)/)?.[1] || i;
                list.push({
                    vod_id: vod_id,
                    vod_name: title || '未知',
                    vod_pic: img.includes('blob:') ? '' : img,
                    vod_remarks: duration || '未知'
                });
            }
        });
        const page = parseInt(pg) || 1;
        const pagecount = parseInt($('.pager-label strong').last().text()) || 1;
        const limit = list.length;
        const total = parseInt($('.dx-pager').attr('data-rec-total')) || list.length;
        return JSON.stringify({ page, pagecount, limit, total, list });
    } catch (e) {
        console.error(`获取分类数据失败: URL=${url}, 错误=${e.message}`);
        return JSON.stringify({ page: parseInt(pg) || 1, pagecount: 1, limit: 0, total: 0, list: [] });
    }
}

async function detail(a) {
    const ids = Array.isArray(a) ? a : [a];
    const vod_id = ids[0];
    console.log(`获取详情数据: 视频ID=${vod_id}`);
    let url = `https://stgay.com/视频/unknown/${vod_id}`;
    try {
        const html = await req(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Referer': 'https://stgay.com',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
            }
        });
        await new Promise(resolve => setTimeout(resolve, 30000));
        const $ = cheerio.load(html);
        const vod_name = $('.dx-title').text().trim() || '未知';
        const vod = {
            vod_id: vod_id,
            vod_name: vod_name,
            vod_pic: $('#mse').attr('data-poster') || $('.poster img').attr('data-src') || '',
            type_name: $('ul.flex.flex-wrap a.link').map((i, el) => $(el).text().trim()).get().join(',') || '未知',
            vod_year: $('.flex.items-center svg use[href*="#time"] + *').text().trim() || '未知',
            vod_area: '未知',
            vod_remarks: $('.time-duration').text().trim() || '未知',
            vod_actor: '未知',
            vod_director: '未知',
            vod_content: $('h2.bg-base7').text().trim() || '无简介',
            vod_play_from: '默认',
            vod_play_url: $('#mse').attr('data-url') || $('.poster').attr('data-url') || ''
        };
        if (!vod.vod_play_url) {
            console.error(`详情页 ${url} 未找到播放地址`);
            return JSON.stringify({ list: [] });
        }
        return JSON.stringify({ list: [vod] });
    } catch (e) {
        console.error(`获取详情数据失败: URL=${url}, 错误=${e.message}`);
        // 尝试标题构造 URL
        if (ext.vod_name) {
            const title = encodeURIComponent(ext.vod_name.replace(/[\/\\?%*:|"<>]/g, '')); // 清理非法字符
            url = `https://stgay.com/视频/${title}/${vod_id}`;
            try {
                const html = await req(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                        'Referer': 'https://stgay.com',
                        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
                    }
                });
                await new Promise(resolve => setTimeout(resolve, 30000));
                const $ = cheerio.load(html);
                const vod = {
                    vod_id: vod_id,
                    vod_name: $('.dx-title').text().trim() || '未知',
                    vod_pic: $('#mse').attr('data-poster') || $('.poster img').attr('data-src') || '',
                    type_name: $('ul.flex.flex-wrap a.link').map((i, el) => $(el).text().trim()).get().join(',') || '未知',
                    vod_year: $('.flex.items-center svg use[href*="#time"] + *').text().trim() || '未知',
                    vod_area: '未知',
                    vod_remarks: $('.time-duration').text().trim() || '未知',
                    vod_actor: '未知',
                    vod_director: '未知',
                    vod_content: $('h2.bg-base7').text().trim() || '无简介',
                    vod_play_from: '默认',
                    vod_play_url: $('#mse').attr('data-url') || $('.poster').attr('data-url') || ''
                };
                if (!vod.vod_play_url) {
                    console.error(`标题构造 URL ${url} 未找到播放地址`);
                    return JSON.stringify({ list: [] });
                }
                return JSON.stringify({ list: [vod] });
            } catch (e2) {
                console.error(`标题构造 URL 失败: URL=${url}, 错误=${e2.message}`);
                return JSON.stringify({ list: [] });
            }
        }
        return JSON.stringify({ list: [] });
    }
}

async function play(flag, id, vipFlags) {
    console.log(`获取播放地址: 播放源=${flag}, 地址ID=${id}`);
    try {
        let result = {
            parse: 0,
            url: id,
            header: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Referer': 'https://stgay.com',
                'Origin': 'https://stgay.com',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Connection': 'keep-alive'
            }
        };
        if (id.includes('stgay.com')) {
            const html = await req(id, { headers: result.header });
            await new Promise(resolve => setTimeout(resolve, 30000));
            const $ = cheerio.load(html);
            let playUrl = $('#mse').attr('data-url') || $('.poster').attr('data-url') || '';
            if (playUrl && (playUrl.endsWith('.m3u8') || playUrl.endsWith('.mp4'))) {
                result.url = playUrl;
            } else {
                const regex = /https:\/\/(hls\.qzkj\.tech|ts\.delipu\.cc|10play\.scutwc\.cn)\/watch\/[^"]+\.m3u8[^"]*/;
                const match = html.match(regex);
                if (match) {
                    result.url = match[0];
                } else {
                    console.error(`未找到有效播放地址: URL=${id}`);
                    result.parse = 1;
                    result.url = id;
                }
            }
        } else if (id.endsWith('.m3u8')) {
            result.url = id;
        } else {
            console.error(`无效播放地址: ${id}`);
            result.parse = 1;
        }
        return JSON.stringify(result);
    } catch (e) {
        console.error(`获取播放地址失败: URL=${id}, 错误=${e.message}`);
        return JSON.stringify({ parse: 0, url: id });
    }
}

async function search(key, quick, pg) {
    console.log(`执行搜索: 关键词=${key}, 页码=${pg}`);
    const url = `https://stgay.com/视频/search/${encodeURIComponent(key)}/${pg}`;
    try {
        const html = await req(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Referer': 'https://stgay.com',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
            }
        });
        await new Promise(resolve => setTimeout(resolve, 30000));
        const $ = cheerio.load(html);
        let list = [];
        $('.video-items .video-item').each((i, elem) => {
            const title = $(elem).find('a.line-clamp-1').text().trim();
            const duration = $(elem).find('div.text-sm.opacity-50').text().trim();
            const link = $(elem).find('a.line-clamp-1').attr('href') || '';
            const img = $(elem).find('img').attr('data-src') || $(elem).find('img').attr('src') || '';
            if (link && title && !link.includes('ha69gx75ax.com')) {
                const vod_id = link.match(/\/视频\/[^/]+\/([^/]+)/)?.[1] || i;
                list.push({
                    vod_id: vod_id,
                    vod_name: title || '未知',
                    vod_pic: img.includes('blob:') ? '' : img,
                    vod_remarks: duration || '搜索结果'
                });
            }
        });
        return JSON.stringify({ list: list });
    } catch (e) {
        console.error("搜索失败: ", e);
        return JSON.stringify({ list: [] });
    }
}