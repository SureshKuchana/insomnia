import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { MockedFunction } from 'jest-mock';

import { logger } from '../cli';
import { globalBeforeAll, globalBeforeEach } from '../jest/before';
import { writeFileWithCliOptions as _writeFileWithCliOptions } from '../write-file';
import { exportSpecification } from './export-specification';

jest.mock('../write-file');

const writeFileWithCliOptions = _writeFileWithCliOptions as MockedFunction<typeof _writeFileWithCliOptions>;

describe('exportSpecification()', () => {
  beforeAll(() => {
    globalBeforeAll();
  });

  beforeEach(() => {
    globalBeforeEach();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should load identifier from database', async () => {
    const result = await exportSpecification('spc_46c5a4a40e83445a9bd9d9758b86c16c', {
      workingDir: 'src/db/fixtures/git-repo',
    });
    expect(result).toBe(true);
    expect(writeFileWithCliOptions).not.toHaveBeenCalled();
    expect(logger.__getLogs().log).toEqual([expect.stringContaining("openapi: '3.0.2")]);
  });

  it('should not remove all x-kong annotations from spec if skipAnnotations false', async () => {
    const result = await exportSpecification('spc_46c5a4a40e83445a9bd9d9758b86c16c', {
      workingDir: 'src/db/fixtures/git-repo', skipAnnotations: false,
    });
    expect(result).toBe(true);
    expect(writeFileWithCliOptions).not.toHaveBeenCalled();
    expect(logger.__getLogs().log?.toString()).toContain('x-kong-');
  });

  it('should remove all x-kong annotations from spec if skipAnnotations true', async () => {
    const result = await exportSpecification('spc_46c5a4a40e83445a9bd9d9758b86c16c', {
      workingDir: 'src/db/fixtures/git-repo', skipAnnotations: true,
    });
    expect(result).toBe(true);
    expect(writeFileWithCliOptions).not.toHaveBeenCalled();
    expect(logger.__getLogs().log?.toString()).not.toContain('x-kong-');
  });

  it('should output document to a file', async () => {
    const outputPath = 'this-is-the-output-path';
    writeFileWithCliOptions.mockResolvedValue(outputPath);
    const options = {
      output: 'output.yaml',
      workingDir: 'src/db/fixtures/git-repo',
    };
    const result = await exportSpecification('spc_46c5a4a40e83445a9bd9d9758b86c16c', options);
    expect(result).toBe(true);
    expect(writeFileWithCliOptions).toHaveBeenCalledWith(
      options.output,
      expect.stringContaining("openapi: '3.0.2"),
      options.workingDir,
    );
    expect(logger.__getLogs().log).toEqual([`Specification exported to "${outputPath}".`]);
  });

  it('should throw if writing file returns error', async () => {
    const error = new Error('error message');
    writeFileWithCliOptions.mockRejectedValue(error);
    const options = {
      output: 'output.yaml',
      workingDir: 'src/db/fixtures/git-repo',
    };
    await expect(
      exportSpecification('spc_46c5a4a40e83445a9bd9d9758b86c16c', options),
    ).rejects.toThrowError(error);
  });

  it('should return false if spec could not be found', async () => {
    const result = await exportSpecification('not-found', {
      workingDir: 'src/db/fixtures/git-repo',
    });
    expect(result).toBe(false);
    const shouldStartWith = logger.__getLogs().fatal?.[0].startsWith('Specification not found at:');
    expect(shouldStartWith).toBe(true);
  });
});
