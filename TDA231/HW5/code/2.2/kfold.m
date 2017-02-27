function [ time, acc ] = kfold(boxconstraint, method, kernel)
load('d2.mat');
tic

Indices = crossvalind('Kfold', size(X, 1), 5);
x1 = zeros(40, 2); y1 = zeros(40, 1); c1 = 1;
x2 = zeros(40, 2); y2 = zeros(40, 1); c2 = 1;
x3 = zeros(40, 2); y3 = zeros(40, 1); c3 = 1;
x4 = zeros(40, 2); y4 = zeros(40, 1); c4 = 1;
x5 = zeros(40, 2); y5 = zeros(40, 1); c5 = 1;

for i=1:size(Indices, 1)
    if Indices(i) == 1
       x1(c1, :) = X(i, :);
       y1(c1, 1) = Y(i, 1);
       c1 = c1 + 1;
    elseif Indices(i) == 2
       x2(c2, :) = X(i, :);
       y2(c2, 1) = Y(i, 1);
       c2 = c2 + 1;
    elseif Indices(i) == 3
       x3(c3, :) = X(i, :);
       y3(c3, 1) = Y(i, 1);
       c3 = c3 + 1;
    elseif Indices(i) == 4
       x4(c4, :) = X(i, :);
       y4(c4, 1) = Y(i, 1);
       c4 = c4 + 1;
    else
       x5(c5, :) = X(i, :);
       y5(c5, 1) = Y(i, 1);
       c5 = c5 + 1; 
    end
end

nErrors = 0;
SVMStruct1 = svmtrain(x1, y1, 'boxconstraint', boxconstraint, ...
             'autoscale', false, 'method', method, 'kernel_function', kernel);
classification1 = svmclassify(SVMStruct1, x1);
nErrors = nErrors + check_errors(y1, classification1);

SVMStruct2 = svmtrain(x2, y2, 'boxconstraint', boxconstraint, ...
             'autoscale', false, 'method', method, 'kernel_function', kernel);
classification2 = svmclassify(SVMStruct2, x2);
nErrors = nErrors + check_errors(y2, classification2);

SVMStruct3 = svmtrain(x3, y3, 'boxconstraint', boxconstraint, ...
             'autoscale', false, 'method', method, 'kernel_function', kernel);
classification3 = svmclassify(SVMStruct3, x3);
nErrors = nErrors + check_errors(y3, classification3);


SVMStruct4 = svmtrain(x4, y4, 'boxconstraint', boxconstraint, ...
             'autoscale', false, 'method', method, 'kernel_function', kernel);
classification4 = svmclassify(SVMStruct4, x4);
nErrors = nErrors + check_errors(y4, classification4);


SVMStruct5 = svmtrain(x5, y5, 'boxconstraint', boxconstraint, ...
             'autoscale', false, 'method', method, 'kernel_function', kernel);
classification5 = svmclassify(SVMStruct5, x5);
nErrors = nErrors + check_errors(y5, classification5);

acc = 1 - nErrors/200
time = toc
end

