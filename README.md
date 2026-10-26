# devpilot

[![CI](https://github.com/77micz/devpilot/actions/workflows/ci.yml/badge.svg)](https://github.com/77micz/devpilot/actions/workflows/ci.yml)

一个小巧、零运行时依赖的命令行工具，用来分析项目路径。

当前版本完成了 CLI 骨架：校验路径是否存在，并输出规范化后的绝对路径。后续可以在 `analyze` 命令上继续扩展项目结构、依赖和健康度分析。

## 环境要求

- Node.js 20 或更高版本
- npm（随 Node.js 安装）

## 安装

```bash
git clone https://github.com/77micz/devpilot.git
cd devpilot
npm install -g .
```

开发时如果不想全局安装，也可以直接运行：

```bash
node ./bin/devpilot.js --help
```

或者创建本地命令链接：

```bash
npm link
```

## 使用

```bash
# 查看帮助
devpilot --help

# 查看版本
devpilot --version

# 分析当前目录：目前只校验并打印绝对路径
devpilot analyze .

# 分析指定文件或目录
devpilot analyze ./src
```

示例输出：

```text
$ devpilot analyze ./src
D:\projects\demo\src
```

`analyze` 只输出路径本身，方便在脚本中继续处理。路径可以包含空格；以 `-` 开头的路径请放在 `--` 之后：

```bash
devpilot analyze -- --strange-name
```

## 退出码

| 退出码 | 含义 |
| --- | --- |
| `0` | 成功 |
| `1` | 路径不存在或无法访问 |
| `2` | 用法错误，例如缺少路径、参数过多或未知选项 |

错误信息写入 stderr，正常结果写入 stdout。

## 开发与测试

```bash
npm test
npm run check
```

测试使用 Node.js 内置的 `node:test`，不需要安装第三方测试框架。

## 技术选择

项目使用 Node.js 原生 ESM 实现，不引入运行时依赖：安装简单，跨平台，并且可以直接复用 Node.js 的文件系统和测试能力。对于需要分发给大量用户、且希望提供单文件二进制的 CLI，Go 或 Rust 会更合适；`devpilot` 当前优先考虑快速迭代和 npm 生态，因此选择 Node.js。

## License

MIT
