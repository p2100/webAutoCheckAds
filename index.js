import puppeteer from "puppeteer";
import config from "./config.js";
// 可选：使用 @puppeteer/browsers 进行浏览器管理
// import { install, launch, getInstalledBrowsers, Browser } from "@puppeteer/browsers";

class WebsiteChecker {
  constructor() {
    this.browser = null;
    this.adResponses = []; // 记录广告响应
  }

  /**
   * 初始化浏览器
   */
  async init() {
    console.log("正在启动浏览器...");
    this.browser = await puppeteer.launch({
      headless: true, // 使用标准无头模式（24.10.0 版本推荐）
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--disable-gpu",
        "--disable-web-security", // 改善跨域请求处理
        "--disable-extensions",
        "--disable-plugins",
        "--disable-default-apps",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-client-side-phishing-detection",
        "--disable-default-apps",
        "--disable-hang-monitor",
        "--disable-popup-blocking",
        "--disable-prompt-on-repost",
        "--disable-sync",
        "--metrics-recording-only",
        "--no-first-run",
        "--safebrowsing-disable-auto-update",
        "--enable-automation",
        "--password-store=basic",
        "--use-mock-keychain",
      ],
      // 稳定的超时配置
      timeout: 30000,
      ignoreDefaultArgs: ['--disable-extensions'], // 避免参数冲突
    });
    console.log("浏览器启动成功");
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log("浏览器已关闭");
    }
  }

  /**
   * 格式化时间戳
   */
  formatTimestamp(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 识别广告类型
   */
  identifyAdType(url) {
    try {
      // 判断是否为AdSense广告
      if (url.startsWith("https://googleads.g.doubleclick.net/pagead/ads")) {
        return {
          platform: "as",
          platformName: "AdSense"
        };
      }

      // 判断是否为Google Ad Manager广告
      if (url.startsWith("https://securepubads.g.doubleclick.net/gampad/ads") || 
          url.startsWith("https://pubads.g.doubleclick.net/gampad/ads")) {
        return {
          platform: "gam", 
          platformName: "Google Ad Manager"
        };
      }

      return null;
    } catch (error) {
      console.error("URL解析错误:", error);
      return null;
    }
  }



  /**
   * 设置网络请求拦截
   */
  async setupRequestInterception(page, device, pageUrl) {
    // 使用稳定的页面事件监听方式
    page.on("response", (response) => {
      try {
        const url = response.url();
        const status = response.status();

        // 识别广告类型
        const adTypeInfo = this.identifyAdType(url);

        if (adTypeInfo) {
          const adRecord = {
            url: url,
            pageUrl: pageUrl, // 添加被检测的页面URL
            status: status,
            timestamp: this.formatTimestamp(new Date()),
            isSuccess: status >= 200 && status < 400,
            device: device,
            platform: adTypeInfo.platform,
            platformName: adTypeInfo.platformName
          };

          // 记录广告响应
          this.adResponses.push(adRecord);
        }

        // 只打印非广告的失败响应
        if (!adTypeInfo && (status < 200 || status >= 400)) {
          // console.log(`响应失败: ${status} ${url}`);
        }
      } catch (error) {
        // 忽略响应处理中的错误，避免中断主流程
        console.warn(`处理响应时出错: ${error.message}`);
      }
    });

    // 添加错误处理
    page.on("error", (error) => {
      console.warn(`页面错误: ${error.message}`);
    });

    page.on("pageerror", (error) => {
      console.warn(`页面脚本错误: ${error.message}`);
    });
  }

  /**
   * 获取设备配置
   */
  getDeviceConfig(device) {
    const configs = {
      pc: {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
      },
      mobile: {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
      ipad: {
        userAgent:
          "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        viewport: { width: 1200, height: 1366 },
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: true,
      },
    };
    return configs[device] || configs.pc;
  }

  /**
   * 检测单个URL
   */
  async checkUrl(url, device = "pc", urlSettings = null) {
    let page = null;
    
    try {
      page = await this.browser.newPage();
      
      // 设置页面错误处理
      page.on('error', (error) => {
        console.warn(`页面错误 [${device}]: ${error.message}`);
      });
      
      page.on('pageerror', (error) => {
        console.warn(`页面脚本错误 [${device}]: ${error.message}`);
      });
      const deviceConfig = this.getDeviceConfig(device);

      // 设置用户代理
      await page.setUserAgent(deviceConfig.userAgent);

      // 设置视窗大小和设备参数
      await page.setViewport({
        width: deviceConfig.viewport.width,
        height: deviceConfig.viewport.height,
        deviceScaleFactor: deviceConfig.deviceScaleFactor,
        isMobile: deviceConfig.isMobile,
        hasTouch: deviceConfig.hasTouch,
      });

      // 设置请求拦截
      await this.setupRequestInterception(page, device, url);

      console.log(`正在检测URL: ${url} [${device.toUpperCase()}]`);

      // 访问页面 - 使用更稳定的加载策略
      const response = await page.goto(url, {
        waitUntil: "networkidle2", // 使用更稳定的网络空闲检测
        timeout: 30000, // 适中的超时时间
      });

      // 等待页面完全加载和JS执行
      try {
        await page.waitForFunction(() => document.readyState === "complete", {
          timeout: 5000
        });
      } catch (error) {
        console.warn(`等待页面完全加载超时: ${error.message}`);
        // 继续执行，不中断流程
      }

      // 执行配置中的actions操作
      await this.executeActions(page, device, url, urlSettings);

      // 检查响应状态
      const status = response.status();

      // 获取页面内容
      const content = await page.content();

      // 只有状态码200才算成功
      const isSuccess = status === 200;

      // 获取页面标题
      const title = await page.title();

      // 获取页面的实际渲染尺寸
      const dimensions = await page.evaluate(() => {
        return {
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          documentWidth: document.documentElement.scrollWidth,
          documentHeight: document.documentElement.scrollHeight,
          screenWidth: screen.width,
          screenHeight: screen.height,
          devicePixelRatio: window.devicePixelRatio,
        };
      });

      const result = {
        url,
        device,
        status,
        isSuccess,
        title,
        contentLength: content.length,
        dimensions,
        timestamp: this.formatTimestamp(new Date()),
      };

      console.log(
        `检测结果: ${url} [${device.toUpperCase()}] - 状态码: ${status} - 成功: ${
          isSuccess ? "是" : "否"
        } - 尺寸: ${dimensions.windowWidth}x${dimensions.windowHeight}`
      );

      return result;
    } catch (error) {
      console.error(`检测URL失败: ${url} [${device.toUpperCase()}]`, error.message);
      return {
        url,
        device,
        status: 0,
        isSuccess: false,
        error: error.message,
        timestamp: this.formatTimestamp(new Date()),
      };
    } finally {
      if (page && !page.isClosed()) {
        try {
          await page.close();
        } catch (error) {
          console.warn(`关闭页面时出错: ${error.message}`);
        }
      }
    }
  }

  /**
   * 安全点击方法 - 解决元素不在可视窗口时的点击问题
   * @param {Page} page - Puppeteer页面对象
   * @param {string} selector - 元素选择器
   * @param {string} device - 设备类型
   */
  async safeClick(page, selector, device) {
    try {
      // 1. 先滚动到元素位置，使其在视窗中心
      console.log(`[${device.toUpperCase()}] 滚动到元素: ${selector}`);
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (element) {
          element.scrollIntoView({ 
            behavior: "smooth", 
            block: "center", 
            inline: "center" 
          });
        }
      }, selector);

      // 2. 等待滚动完成和元素稳定
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. 确保元素仍然可见且可点击
      await page.waitForSelector(selector, { 
        visible: true, 
        timeout: 5000 
      });

      // 4. 获取元素的边界框信息
      const elementHandle = await page.$(selector);
      if (!elementHandle) {
        throw new Error(`元素未找到: ${selector}`);
      }

      const boundingBox = await elementHandle.boundingBox();
      if (!boundingBox) {
        throw new Error(`无法获取元素边界框: ${selector}`);
      }

      // 5. 检查元素是否在视窗内
      const viewport = page.viewport();
      const isInViewport = boundingBox.y >= 0 && 
                          boundingBox.y + boundingBox.height <= viewport.height &&
                          boundingBox.x >= 0 && 
                          boundingBox.x + boundingBox.width <= viewport.width;

      if (!isInViewport) {
        console.log(`[${device.toUpperCase()}] 元素不在视窗内，重新滚动`);
        // 重新滚动到元素位置
        await page.evaluate((sel) => {
          const element = document.querySelector(sel);
          if (element) {
            element.scrollIntoView({ 
              behavior: "auto", 
              block: "center", 
              inline: "center" 
            });
          }
        }, selector);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 6. 使用坐标点击，更精确
      const clickX = boundingBox.x + boundingBox.width / 2;
      const clickY = boundingBox.y + boundingBox.height / 2;
      
      console.log(`[${device.toUpperCase()}] 在坐标 (${Math.round(clickX)}, ${Math.round(clickY)}) 点击元素`);
      await page.mouse.click(clickX, clickY);

      // 7. 短暂等待确保点击生效
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      // 如果安全点击失败，尝试使用原始点击方法作为备选
      try {
        console.log(`[${device.toUpperCase()}] 尝试使用原始点击方法: ${selector}`);
        await page.click(selector);
        console.log(`[${device.toUpperCase()}] 原始点击方法成功: ${selector}`);
      } catch (fallbackError) {
        console.error(`[${device.toUpperCase()}] 原始点击方法也失败: ${selector}`, fallbackError.message);
        throw new Error(`所有点击方法都失败: ${error.message}`);
      }
    }
  }

  /**
   * 执行配置中的actions操作
   * @param {Page} page - Puppeteer页面对象
   * @param {string} device - 设备类型
   * @param {string} url - 当前页面URL
   * @param {Object} urlSettings - 当前URL的配置设置
   */
  async executeActions(page, device, url, urlSettings) {
    let actions = [];

    // 从URL配置中获取actions
    if (urlSettings && urlSettings.actions) {
      actions = urlSettings.actions;
    }

    if (actions.length === 0) {
      console.log(`[${device.toUpperCase()}] ${url} 没有需要执行的操作`);
      return;
    }

    // await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(`[${device.toUpperCase()}] ${url} 开始执行 ${actions.length} 个操作`);

    for (let i = 0; i < actions.length; i++) {
      const actionConfig = actions[i];
      const { selector, action, delay = 0 } = actionConfig;

      try {
        // 等待元素出现
        console.log(`[${device.toUpperCase()}] 等待元素: ${selector}`);
        await page.waitForSelector(selector, { 
          timeout: 10000,
          visible: true // 确保元素可见
        });

        // 执行对应的操作
        switch (action) {
          case "click":
            console.log(`[${device.toUpperCase()}] 点击元素: ${selector}`);
            // 使用更稳定的点击方法
            await this.safeClick(page, selector, device);
            break;

          case "hover":
            console.log(`[${device.toUpperCase()}] 悬停元素: ${selector}`);
            await page.hover(selector);
            break;

          case "focus":
            console.log(`[${device.toUpperCase()}] 聚焦元素: ${selector}`);
            await page.focus(selector);
            break;

          case "scroll":
            console.log(`[${device.toUpperCase()}] 滚动到元素: ${selector}`);
            await page.evaluate((sel) => {
              const element = document.querySelector(sel);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, selector);
            break;

          default:
            console.warn(`[${device.toUpperCase()}] 不支持的操作类型: ${action}`);
        }

        console.log(
          `[${device.toUpperCase()}] 操作 ${i + 1}/${
            actions.length
          } 执行成功: ${action} ${selector}`
        );

        // 在操作执行完成后延迟等待
        if (delay > 0) {
          console.log(`[${device.toUpperCase()}] 操作完成后等待 ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(
          `[${device.toUpperCase()}] 操作 ${i + 1}/${
            actions.length
          } 执行失败: ${action} ${selector}`,
          error.message
        );
        // 继续执行下一个操作，不中断整个流程
      }
    }

    console.log(`[${device.toUpperCase()}] 所有操作执行完成`);
  }

  /**
   * 检测配置类型
   * @param {Object} config - 配置对象
   * @returns {string} - 'unified' 表示统一配置，'device-specific' 表示设备特定配置
   */
  detectConfigType(config) {
    // 检查配置的第一级key是否为设备类型
    const deviceTypes = ["pc", "mobile", "ipad"];
    const configKeys = Object.keys(config);

    // 如果所有的key都是设备类型，则认为是设备特定配置
    const isDeviceSpecific = configKeys.every((key) => deviceTypes.includes(key));

    if (isDeviceSpecific) {
      return "device-specific";
    } else {
      return "unified";
    }
  }

  /**
   * 统一检测配置函数
   * @param {Object} config - 配置对象
   * @param {string} configName - 配置名称（用于日志显示）
   */
  async checkConfig(config, configName = "未知配置") {
    const configType = this.detectConfigType(config);
    console.log(
      `\n=== 开始检测(${configName}类型: ${
        configType === "unified" ? "三端配置相同" : "三端分别配置"
      }) ===`
    );

    const results = [];

    if (configType === "unified") {
      for (const [url, settings] of Object.entries(config.check)) {
        // 分别用三种设备检测
        for (const device of ["pc", "mobile", "ipad"]) {
          const result = await this.checkUrl(url, device, settings);
          result.device = device;
          result.settings = settings;
          result.configType = configType;
          results.push(result);
        }
      }
    } else {
      for (const [device, objs] of Object.entries(config)) {
        for (const [url, settings] of Object.entries(objs.check)) {
          const result = await this.checkUrl(url, device, settings);
          result.device = device;
          result.settings = settings;
          result.configType = configType;
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * 获取广告响应记录
   */
  getAdResponses() {
    return this.adResponses;
  }

  /**
   * 清空广告响应记录
   */
  clearAdResponses() {
    this.adResponses = [];
  }

  /**
   * 生成检测报告
   */
  generateReport(results) {
    console.log("\n=== html响应检测报告 ===");

    const summary = {
      total: results.length,
      success: results.filter((r) => r.isSuccess).length,
      failed: results.filter((r) => !r.isSuccess).length,
      status200: results.filter((r) => r.status === 200).length,
    };

    console.log(`总检测数: ${summary.total}`);
    console.log(`成功(状态200): ${summary.success}`);
    console.log(`失败: ${summary.failed}`);

    console.log("\n详细结果:");
    results.forEach((result, index) => {
      console.log(
        `${index + 1}. [${result.device?.toUpperCase() || "PC"}] ${
          result.url
        }  状态: ${result.isSuccess ? "成功" : "失败"} (HTTP ${result.status})`
      );

      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
      console.log("");
    });

    return summary;
  }

  /**
   * 生成广告统计报告 - 简化版本，只显示AS和GAM广告数量
   */
  generateAdReport() {
    const adResponses = this.getAdResponses();
    console.log(`\n=== 广告响应统计 ===`);
    console.log(`总广告请求数: ${adResponses.length}`);

    if (adResponses.length === 0) {
      console.log("未检测到广告请求");
      return;
    }

    // 按页面-设备-广告类型层级结构统计
    const hierarchyStats = {};

    adResponses.forEach((ad) => {
      const pageUrl = ad.pageUrl; // 被检测的页面URL
      const device = ad.device; // pc, mobile, ipad
      const platform = ad.platform; // as 或 gam
      
      // 初始化页面统计
      if (!hierarchyStats[pageUrl]) {
        hierarchyStats[pageUrl] = {
          total: 0,
          success: 0,
          failed: 0,
          devices: {}
        };
      }
      
      // 初始化设备统计
      if (!hierarchyStats[pageUrl].devices[device]) {
        hierarchyStats[pageUrl].devices[device] = {
          total: 0,
          success: 0,
          failed: 0,
          adTypes: {}
        };
      }
      
      // 初始化广告类型统计
      if (!hierarchyStats[pageUrl].devices[device].adTypes[platform]) {
        hierarchyStats[pageUrl].devices[device].adTypes[platform] = {
          total: 0,
          success: 0,
          failed: 0
        };
      }
      
      // 更新页面总统计
      hierarchyStats[pageUrl].total++;
      if (ad.isSuccess) {
        hierarchyStats[pageUrl].success++;
      } else {
        hierarchyStats[pageUrl].failed++;
      }
      
      // 更新设备统计
      hierarchyStats[pageUrl].devices[device].total++;
      if (ad.isSuccess) {
        hierarchyStats[pageUrl].devices[device].success++;
      } else {
        hierarchyStats[pageUrl].devices[device].failed++;
      }
      
      // 更新广告类型统计
      hierarchyStats[pageUrl].devices[device].adTypes[platform].total++;
      if (ad.isSuccess) {
        hierarchyStats[pageUrl].devices[device].adTypes[platform].success++;
      } else {
        hierarchyStats[pageUrl].devices[device].adTypes[platform].failed++;
      }
    });

    // 按页面-设备-广告类型层级显示统计
    Object.entries(hierarchyStats).forEach(([pageUrl, pageStat]) => {
      console.log(`\n页面: ${pageUrl}`);
      console.log(`  总计: ${pageStat.total}个广告请求 (成功: ${pageStat.success}, 失败: ${pageStat.failed})`);
      
      // 显示各设备统计
      Object.entries(pageStat.devices).forEach(([device, deviceStats]) => {
        console.log(`设备: ${device.toUpperCase()}`);
        console.log(`    总计: ${deviceStats.total}个 (成功: ${deviceStats.success}, 失败: ${deviceStats.failed})`);
        
        // 显示各广告类型统计
        Object.entries(deviceStats.adTypes).forEach(([platform, adTypeStats]) => {
          const platformName = platform === 'as' ? 'AdSense' : 'Google Ad Manager';
          console.log(`    ${platform.toUpperCase()} (${platformName}): ${adTypeStats.total}个 (成功: ${adTypeStats.success}, 失败: ${adTypeStats.failed})`);
        });
      });
    });

    // 显示失败请求汇总
    const failedAds = adResponses.filter((ad) => !ad.isSuccess);
    if (failedAds.length > 0) {
      console.log(`\n失败请求汇总 (${failedAds.length}个):`);
      
      // 按错误状态码分组
      const errorGroups = {};
      failedAds.forEach((ad) => {
        if (!errorGroups[ad.status]) {
          errorGroups[ad.status] = [];
        }
        errorGroups[ad.status].push(ad);
      });
      
      Object.entries(errorGroups).forEach(([status, ads]) => {
        console.log(`\n  HTTP ${status} 错误 (${ads.length}个):`);
        ads.slice(0, 3).forEach((ad, index) => {
          console.log(`    ${index + 1}. [${ad.device}] [${ad.platform.toUpperCase()}] ${ad.pageUrl}`);
          console.log(`       时间: ${ad.timestamp}`);
        });
        if (ads.length > 3) {
          console.log(`    ... 还有 ${ads.length - 3} 个相同错误`);
        }
      });
    }

    return {
      total: adResponses.length,
      success: adResponses.filter((ad) => ad.isSuccess).length,
      failed: failedAds.length,
      hierarchyStats
    };
  }

  /**
   * 生成简化的配置对比结果
   * @param {Object} config - 配置对象
   * @param {Object} hierarchyStats - 层级统计数据
   */
  generateSimpleComparisonReport(config, hierarchyStats) {
    const configType = this.detectConfigType(config);
    const result = {
      pc: {},
      mobile: {},
      ipad: {}
    };

    if (configType === "unified") {
      // 统一配置模式
      Object.entries(config.check).forEach(([url, expectedConfig]) => {
        const urlStats = hierarchyStats[url];
        
        // 获取预期配置（不包含actions）
        const cleanExpected = {};
        Object.keys(expectedConfig).forEach(key => {
          if (key !== 'actions') {
            cleanExpected[key] = expectedConfig[key];
          }
        });

        ['pc', 'mobile', 'ipad'].forEach(device => {
          const deviceStats = urlStats?.devices?.[device];
          
          result[device][url] = {
            passed: true,
            expected: cleanExpected,
            actual: {
              as: deviceStats?.adTypes?.as?.success || 0,
              gam: deviceStats?.adTypes?.gam?.success || 0
            }
          };

          // 检查是否通过
          let hasError = false;
          const errors = [];

          ['as', 'gam'].forEach(platform => {
            const expected = cleanExpected[platform];
            const actual = deviceStats?.adTypes?.[platform]?.success || 0;

            if (expected !== undefined && actual !== expected) {
              hasError = true;
              const platformName = platform === 'as' ? 'AdSense' : 'Google Ad Manager';
              errors.push(`${platformName}: 预期 ${expected} 个，实际 ${actual} 个`);
            }
          });

          if (hasError) {
            result[device][url].passed = false;
            result[device][url].reason = errors.join('; ');
          }
        });
      });
    } else {
      // 设备特定配置模式
      Object.entries(config).forEach(([device, deviceConfig]) => {
        Object.entries(deviceConfig.check).forEach(([url, expectedConfig]) => {
          const urlStats = hierarchyStats[url];
          const deviceStats = urlStats?.devices?.[device];
          
          // 获取预期配置（不包含actions）
          const cleanExpected = {};
          Object.keys(expectedConfig).forEach(key => {
            if (key !== 'actions') {
              cleanExpected[key] = expectedConfig[key];
            }
          });

          result[device][url] = {
            passed: true,
            expected: cleanExpected,
            actual: {
              as: deviceStats?.adTypes?.as?.success || 0,
              gam: deviceStats?.adTypes?.gam?.success || 0
            }
          };

          // 检查是否通过
          let hasError = false;
          const errors = [];

          ['as', 'gam'].forEach(platform => {
            const expected = cleanExpected[platform];
            const actual = deviceStats?.adTypes?.[platform]?.success || 0;

            if (expected !== undefined && actual !== expected) {
              hasError = true;
              const platformName = platform === 'as' ? 'AdSense' : 'Google Ad Manager';
              errors.push(`${platformName}: 预期 ${expected} 个，实际 ${actual} 个`);
            }
          });

          if (hasError) {
            result[device][url].passed = false;
            result[device][url].reason = errors.join('; ');
          }
        });
      });
    }

    return result;
  }
}

// 主函数
async function main() {
  const checker = new WebsiteChecker();

  try {
    await checker.init();

    // 检测配置1
    const results1 = await checker.checkConfig(config, "配置1");

    // 生成报告
    // checker.generateReport(results1);

    // 生成广告统计报告
    const adReport = checker.generateAdReport();

    // 生成简化的配置对比结果
    const simpleComparisonReport = checker.generateSimpleComparisonReport(config, adReport.hierarchyStats);

    console.log("\n=== 对比结果 ===");
    console.log(JSON.stringify(simpleComparisonReport, null, 2));
  } catch (error) {
    console.error("检测过程中发生错误:", error);
  } finally {
    await checker.close();
  }
}

// 导出类以供其他模块使用
export default WebsiteChecker;

main();
