load('d2.mat');
SVMStruct = svmtrain(X, Y, 'boxconstraint', 1, 'autoscale', false, 'kernel_function', 'rbf', 'showplot', true);
