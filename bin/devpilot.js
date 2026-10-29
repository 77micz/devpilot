#!/usr/bin/env node

// 上面这行叫 shebang，告诉 macOS/Linux 用 node 来执行这个文件。
// Windows 下 npm 会自动生成 .cmd 包装脚本，所以同样可以直接运行 devpilot。
//
// bin 这一层只负责连接“终端”和“真正的 CLI 逻辑”：
// 接收命令行参数、写出结果、设置退出码。具体命令处理放在 src/ 目录。

// 从上一级 src 目录导入 CLI 的入口函数。
import { run } from '../src/cli.js';

try {
  // process.argv 的大致内容是：
  // [node 可执行文件, devpilot.js 路径, 'analyze', '.']
  // slice(2) 去掉前两项，只把用户真正输入的参数交给 run()。
  const result = run(process.argv.slice(2));

  // 正常结果写到 stdout，错误信息写到 stderr。
  // 这样脚本可以用 `devpilot ... > result.txt` 只重定向正常输出。
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  // 设置退出码，而不是立刻调用 process.exit()。
  // 这样 Node 还有机会把缓冲区里的输出写完。
  process.exitCode = result.code;
} catch (error) {
  // run() 会把“可预期”的错误转成结果对象；
  // 这里兜底处理真正的意外错误，默认只显示简短信息，不吓到用户。
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`devpilot: unexpected error: ${message}\n`);

  // 需要排查问题时，设置 DEVPILOT_DEBUG=1 才会额外显示完整堆栈。
  if (process.env.DEVPILOT_DEBUG === '1' && error instanceof Error && error.stack) {
    process.stderr.write(`${error.stack}\n`);
  }

  // 意外错误也属于运行时错误，所以使用退出码 1。
  process.exitCode = 1;
}
