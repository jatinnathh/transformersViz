import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input text' },
        { status: 400 }
      );
    }

    console.log('Processing text:', text);

    // Path to your Python script
    const pythonScriptPath = path.join(process.cwd(), 'transformer', 'api_generate.py');
    console.log('Python script path:', pythonScriptPath);

    // Call Python script to generate text
    const result = await runPythonScript(pythonScriptPath, text);

    console.log('Successfully generated result');
    
    // Parse the result and return structured data
    return NextResponse.json({
      input: text,
      output: result.output,
      tokens: result.tokens,
      attention: result.attention,
      predictions: result.predictions,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process text' },
      { status: 500 }
    );
  }
}

function runPythonScript(scriptPath: string, inputText: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Adjust the Python command based on your conda environment
    // You may need to use the full path to your conda environment's Python
    const transformerDir = path.join(process.cwd(), 'transformer');
    
    const condaRunCommand = 'conda';
    const args = ['run', '-n', 'torch_gpu', '--no-capture-output', 'python', scriptPath, inputText];
    
    console.log(`Using python command: ${condaRunCommand} ${args.join(' ')}`);
    
    const pythonProcess = spawn(condaRunCommand, args, {
      cwd: transformerDir, // Run from transformer directory so model path works
      shell: true
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log('Python stdout:', output);
    });

    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.error('Python stderr:', output);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script failed with code:', code);
        console.error('Error output:', stderr);
        reject(new Error(`Python script exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        // Parse the output from your Python script
        const parsed = JSON.parse(stdout);
        console.log('Successfully parsed Python output');
        resolve(parsed);
      } catch (error) {
        console.error('Failed to parse Python output as JSON:', error);
        console.error('Raw output:', stdout);
        reject(new Error(`Failed to parse Python output: ${error}`));
      }
    });

    // Handle timeout
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Python script timeout'));
    }, 30000); // 30 second timeout
  });
}
