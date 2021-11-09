// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Fill.asm

// Runs an infinite loop that listens to the keyboard input.
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel;
// the screen should remain fully black as long as the key is pressed. 
// When no key is pressed, the program clears the screen, i.e. writes
// "white" in every pixel;
// the screen should remain fully clear as long as no key is pressed.

(START)
// Read the keybord value and store the result
@KBD
D=M
@keyboardValue
M=D

// Our screen is represented by 8192 blocks of 16 bits.
// This will be our counter.
@8192
D=A
@counter
M=D

// Use a variable as screen map index
@SCREEN
D=A
@index
M=D

(LOOP)
// If keyboard value is different from before, jump to start
@KBD
D=M
@keyboardValue
D=D-M

@START
D;JNE

// Decrease counter each time we paint
@counter
M=M-1

// If keyboard value is zero, jump to white.
// Else, do nothing
@keyboardValue
D=M
@PAINT_WHITE
D;JEQ

// Paint
(PAINT_BLACK)
@index
A=M
M=-1

// We need to skip the white paint here
@PAINT_END
0;JMP

(PAINT_WHITE)
@index
A=M
M=0

(PAINT_END)
// Increase index after we paint
@index
M=M+1

// If counter >= 0, go to start
@counter
D=M
@LOOP
D;JGT

// Once done, start program again
@START
0;JMP