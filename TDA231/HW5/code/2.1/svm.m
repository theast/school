load('d1b.mat');
SVMStruct = svmtrain(X, Y, 'boxconstraint', 1, 'autoscale', false);
classify = svmclassify(SVMStruct, X);

% variables for hyperplane
w1 = SVMStruct.Alpha' * SVMStruct.SupportVectors(:,1);
w2 = SVMStruct.Alpha' * SVMStruct.SupportVectors(:,2);
bias = SVMStruct.Bias;
f = @(x1, x2) x1*w1 + x2*w2 + bias;

hold on
% plot all points
for point=1:size(X)
    
    % mark wronly classified points
    if classify(point) ~= SVMStruct.GroupNames(point, 1)
        if classify(point) == -1
            p1 = scatter(X(point,1), X(point,2), 200, 'x', 'MarkerEdgeColor', 'magenta');
            p3 = scatter(X(point,1), X(point,2), '*', 'MarkerEdgeColor', 'b');
        else 
            scatter(X(point,1), X(point,2), 200, 'x', 'MarkerEdgeColor', 'magenta');
            scatter(X(point,1), X(point,2), '+', 'MarkerEdgeColor', 'r');
        end
        
        % Plot points
    elseif classify(point) == -1
        p2 = scatter(X(point,1), X(point,2), '+', 'MarkerEdgeColor', 'r');
    else 
        p3 = scatter(X(point,1), X(point,2), '*', 'MarkerEdgeColor', 'b');
    end
end

% mark support vectors
for point=1:size(SVMStruct.SupportVectorIndices)
    index = SVMStruct.SupportVectorIndices(point, 1);
    p4 = scatter(X(index,1), X(index,2), 100, 'o', 'MarkerEdgeColor', 'black');
end

%plot hyperplane
p6 = ezplot(f, [-3, 4]);
set(p6, 'Color', 'black');

title('');
legend([p2, p3, p4, p1], '-1', '1', 'Support vector', 'Miss classification','Location','northwest');
hold off

disp(sprintf('The classifier bias: %d', SVMStruct.Bias))

soft_margin = 2/((sqrt(w1^2+w2^2)));
disp(sprintf('The soft margin: %d', soft_margin));

