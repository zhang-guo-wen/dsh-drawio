# 部署与生效语义、发版

覆盖：官方安装命令、host/client 两半的生效语义、`HANDOFF_ID` 与 profile 接线的关系、发版与 tag 步骤。
**何时读**：安装或卸载插件、部署验证，回答「改了为什么没生效」，或准备发版时。

## 部署与生效语义

用官方命令安装，它把参数转发给 profile 目录里的包管理器，**并自行维护 profile 清单**（依赖条目与 `dsh.profile.bundles` 的层一起加，不要手写）：

```sh
# npm 官方源
npx @deepseek-ai/dsh plugin --profile web add @guowenzhang/dsh-drawio

# HTTPS
npx @deepseek-ai/dsh plugin --profile web add git+https://github.com/zhang-guo-wen/dsh-drawio.git

# SSH
npx @deepseek-ai/dsh plugin --profile web add git+ssh://git@github.com/zhang-guo-wen/dsh-drawio.git

# 锁定发布 tag，默认分支上后续的临时提交不会被拉到
npx @deepseek-ai/dsh plugin --profile web add "git+https://github.com/zhang-guo-wen/dsh-drawio.git#v1.0.0"

# 本地目录开发安装；包管理器建 symlink，重建 lib/ 后重启即生效，无需重装
npx @deepseek-ai/dsh plugin --profile web add /absolute/path/to/dsh-drawio

# 卸载：依赖条目与 bundle 层一起移除
npx @deepseek-ai/dsh plugin --profile web remove @guowenzhang/dsh-drawio
```

`lib/` 已提交进仓库，所以装完即可运行，**使用者不需要构建**；本地目录安装建的是 symlink，`file:` 依赖则可能退化成物理拷贝，那时改源码不会影响正在跑的 dsh。

- **host 半边是进程内模块。** 重建 `lib/index.mjs` 不会替换正在运行的那份代码，只有重启宿主才会加载新产物。本仓的 host 半边是空的，所以业务改动几乎都在 client 侧。
- **client 半边按内容 revision 提供。** 产物变了刷新页面就会取到新的；`HANDOFF_ID` 就是这个 revision 的标识，改动 client 后必须 bump 它或强刷浏览器，否则浏览器一直跑旧 bundle。
- `HANDOFF_ID` 在 `build-client.mjs` 里，值为 `@guowenzhang/dsh-drawio`，必须与 `lib/client.js` 包裹里的 `id`、`tests/smoke.mjs` 断言的 id 三者一致。

## 发版

`lib/` 是提交进仓库的，所以**发版 = 改版本号 + 构建 + 提交产物 + 打 tag**。别人按 tag 安装，默认分支上后续的临时提交不会被他们拿到。

1. 改根 `package.json` 的 `version`。
2. `npm run build`，确认 `lib/index.mjs` 与 `lib/client.js` 都是最新的。
3. 提交源码与 `lib/`（不要把 `lib/` 落在外面的工作区）。
4. 打带注释的 tag 并推送：

   ```sh
   git tag -a v<version> -m "dsh-drawio <version>"
   git push dsh-drawio main --follow-tags
   ```

5. 验证安装：`npx @deepseek-ai/dsh plugin --profile web add "git+https://github.com/zhang-guo-wen/dsh-drawio.git#v<version>"`，重启宿主后确认 `.drawio` 文件在侧栏里渲染成图表。

推送时段、tag 与 npm 发布的前置条件遵循工作区根 `AGENTS.md`：推送只在 19:00–08:30 进行，`npm publish` 需另行获得用户授权。
