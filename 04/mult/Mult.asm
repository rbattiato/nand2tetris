// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Mult.asm

// Multiplies R0 and R1 and stores the result in R2.
// (R0, R1, R2 refer to RAM[0], RAM[1], and RAM[2], respectively.)
//
// This program only needs to handle arguments that satisfy
// R0 >= 0, R1 >= 0, and R0*R1 < 32768.

// Basicly we need to add R0 to itself R1 times.
// So we need to perform the same basic operation
// that is RAM[0] + RAM[0], exactly R1 times.

// Init the R2 memory location to value 0
@R0
D=A
@R2
M=D

// Use a counter variable: we want to add R0 to itself exactly R1 times
@R1
D=M
@counter
M=D

// Init the loop
(LOOP)
// If counter = 0 skip to END
@counter
M;JEQ
// Add the value held by R0 to R2
@R0
D=M
@R2
M=D+M
// Decrease the counter and go to loop
@counter
M=M-1
@LOOP
0;JMP

(END)
@END
0;JMP