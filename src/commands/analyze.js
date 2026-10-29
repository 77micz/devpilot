// analyze 命令的具体实现。
// 目前只做“路径校验 + 输出绝对路径”，以后可以在这里扩展真正的项目分析。

// statSync 用来同步检查路径是否存在；resolve 用来把相对路径转成绝对路径。
import { statSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 校验路径是否存在，并返回它的绝对路径。
 *
 * 现在刻意只做这一件事，后续版本可以在这个基础上加入项目结构分析。
 *
 * @param {string} pathArg 用户输入的原始路径。
 * @param {string} cwd 当前工作目录，由 cli.js 传入。
 * @returns {{ code: number, stdout: string, stderr: string }}
 */
export function analyzeCommand(pathArg, cwd) {
  // resolve 只做路径计算，不会访问磁盘。
  // 例如 cwd = D:\demo，pathArg = ./src，结果就是 D:\demo\src。
  const target = resolve(cwd, pathArg);

  try {
    // statSync 会真正访问文件系统。
    // 路径不存在时它会抛出异常，而不是返回 false。
    statSync(target);
  } catch (error) {
    // ENOENT：路径不存在；ENOTDIR：路径中间有一段其实是文件。
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return failure(`path does not exist: '${target}'`);
    }

    // EACCES / EPERM：路径可能存在，但当前用户没有访问权限。
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      return failure(`permission denied: '${target}'`);
    }

    // 其他系统错误保留原始信息，方便定位具体原因。
    return failure(`cannot access path '${target}': ${error.message}`);
  }

  // 只输出路径本身加换行，不加“结果：”等前缀，方便脚本继续处理。
  return {
    code: 0,
    stdout: `${target}\n`,
    stderr: '',
  };
}

/**
 * 统一创建运行时错误结果。
 * 运行时错误使用退出码 1，和参数错误（退出码 2）区分开。
 *
 * @param {string} message 错误说明。
 * @returns {{ code: number, stdout: string, stderr: string }}
 */
function failure(message) {
  return {
    code: 1,
    stdout: '',
    stderr: `devpilot: ${message}\n`,
  };
}
